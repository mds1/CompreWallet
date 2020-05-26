<template>
  <q-page padding>
    <h1 class="text-center header">
      Dashboard
    </h1>

    <!-- IF NOT LOGGED IN -->
    <div
      v-if="!userAddress"
      class="text-center"
    >
      Login with MetaMask to get started
      <connect-wallet />
    </div>

    <!-- IF NOT ON KOVAN -->
    <div
      v-else-if="!isValidChain"
      class="text-center"
    >
      Please connect to Kovan and refresh the page
    </div>

    <!-- IF USER HAS NO WALLET -->
    <div
      v-else-if="walletAddress === addressZero"
      class="text-center"
    >
      It looks like this is your first visit. Deploy your contract wallet to get started!
      <base-button
        label="Deploy Wallet"
        @click="deployWallet"
      />
    </div>
    <div v-else>
      <h5 class="secondary text-bold text-center">Balances</h5>
      <div class="row justify-evenly">
        <div
          v-for="(token, index) in balances"
          :key="token.index"
        >
          {{formatNumber(token)}} {{index}}
        </div>
      </div>

      <div class="q-mt-xl q-pt-lg">
        <h5 class="secondary text-bold text-center">Transactions</h5>
        <div class="row justify-evenly">
          <base-button
            label="Add transaction"
            @click="addTransaction"
          />
        </div>
      </div>

    </div>

    <!-- IF A TRANSACTION IS PROCESSING -->
    <div
      v-if="isLoading"
      class="text-center q-mt-xl"
    >
      <q-spinner
        color="secondary"
        size="3rem"
      />
      <div class="q-mt-md">
        <span v-if="txHash">Your transaction is processing...</span>
        <span v-else>Waiting for signature...</span>
      </div>
      <a
        v-if="txHash"
        class="text-caption hyperlink"
        :href="`https://kovan.etherscan.io/tx/${txHash}`"
        target="_blank"
      >View on Etherscan</a>
    </div>
  </q-page>
</template>

<script>
import { mapState } from 'vuex';
import { ethers } from 'ethers';
import ConnectWallet from 'components/ConnectWallet';
import helpers from 'src/mixins/helpers';

export default {
  name: 'Dashboard',

  mixins: [helpers],

  data() {
    return {
      isLoading: undefined,
      addressZero: ethers.constants.AddressZero,
      txHash: undefined,
      receipt: undefined,
      //
      domainType: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      metaTransactionType: [
        { name: 'nonce', type: 'uint256' },
        { name: 'from', type: 'address' },
        { name: 'functionSignature', type: 'bytes' },
      ],
    };
  },

  computed: {
    ...mapState({
      web3: (state) => state.main.web3,
      balances: (state) => state.main.balances,
      addresses: (state) => state.main.contracts.addresses,
      factory: (state) => state.main.contracts.factory, // ethers
      factoryContract: (state) => state.main.contracts.factoryContract, // web3 meta-tx
      provider: (state) => state.main.provider,
      userAddress: (state) => state.main.userAddress,
      walletAddress: (state) => state.main.walletAddress,
      isValidChain: (state) => {
        const { provider } = state.main;
        if (!provider) return true; // assume valid if not connected
        const { chainId } = provider;
        if (chainId === '0x2a' || chainId === '42' || chainId === 42) return true;
        return false;
      },
    }),
  },

  components: {
    ConnectWallet,
  },

  methods: {
    // See sample code at the URL below
    // https://github.com/bcnmy/metatx-standard/blob/master/example/react-ui/src/App.js

    /**
     * @notice Get message to sign
     */
    async getMessage(ethersContract, functionData) {
      const nonce = parseInt((await ethersContract.getNonce(this.userAddress)).toString(), 10);
      return {
        nonce,
        from: this.userAddress,
        functionSignature: functionData,
      };
    },

    /**
     * @notice Returns the blob of data to sign
     */
    getDataToSign(domainData, message) {
      return JSON.stringify({
        types: {
          EIP712Domain: this.domainType,
          MetaTransaction: this.metaTransactionType,
        },
        domain: domainData,
        primaryType: 'MetaTransaction',
        message,
      });
    },

    /**
     * @notice Get EIP712 signature from user and send meta-transaction
     */
    async sendMetaTransaction(contract, dataToSign) {
      const functionData = JSON.parse(dataToSign).message.functionSignature;
      this.web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_signTypedData_v4',
          params: [this.userAddress, dataToSign],
        },
        async (error, response) => {
          if (error || (response && response.error)) {
            this.showError(error);
            this.isLoading = false;
          } else if (response && response.result) {
            const { r, s, v } = this.getSignatureParameters(response.result);
            await this.sendTransaction(contract, this.userAddress, functionData, r, s, v);
          }
        },
      );
    },


    /**
     * @notice Deploy user's wallet on first visit
     */
    async deployWallet() {
      this.isLoading = true;
      const contract = this.factoryContract;
      const logicAddress = this.addresses.compreWallet;
      const functionData = contract.methods.createContract(logicAddress).encodeABI();
      const message = await this.getMessage(this.factory, functionData);

      const domainData = {
        name: 'CompreWalletFactory',
        chainId: 42, // Kovan
        version: '1',
        verifyingContract: this.addresses.compreWalletFactory,
      };
      const dataToSign = this.getDataToSign(domainData, message);

      await this.sendMetaTransaction(contract, dataToSign);
    },


    async sendTransaction(contract, userAddress, functionData, r, s, v) {
      const { web3 } = this;
      if (web3 && contract) {
        try {
          const gasLimit = await contract.methods
            .executeMetaTransaction(userAddress, functionData, r, s, v)
            .estimateGas({ from: userAddress });

          const gasPrice = await web3.eth.getGasPrice();

          const tx = contract.methods
            .executeMetaTransaction(userAddress, functionData, r, s, v)
            .send({
              from: userAddress,
              gasPrice: web3.utils.toHex(gasPrice),
              gasLimit: web3.utils.toHex(gasLimit),
            });
          tx.on('transactionHash', (hash) => {
            this.txHash = hash;
          }).once('confirmation', async (confirmationNumber, receipt) => {
            this.receipt = receipt;
            await this.$store.dispatch('main/setEthereumData', this.provider);
            this.txHash = undefined; // signals to UI that transaction is complete
            this.notifyUser('positive', 'Your transaction was successfully sent!');
            this.isLoading = false;
          });
        } catch (err) {
          this.showError(err);
          this.isLoading = false;
        }
      }
    },

    getSignatureParameters(signature) {
      if (!this.web3.utils.isHexStrict(signature)) {
        throw new Error(
          'Given value "'.concat(signature, '" is not a valid hex string.'),
        );
      }
      const r = signature.slice(0, 66);
      const s = '0x'.concat(signature.slice(66, 130));
      let v = '0x'.concat(signature.slice(130, 132));
      v = this.web3.utils.hexToNumber(v);
      if (![27, 28].includes(v)) v += 27;
      return { r, s, v };
    },

    formatNumber(number, decimals = 4) {
      if (!number) return '-';
      return Number(number).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    },

    addTransaction() {
      console.log('add');
    },
  },
};
</script>
