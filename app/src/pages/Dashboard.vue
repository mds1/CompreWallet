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
      v-else-if="true || walletAddress === addressZero"
      class="text-center"
    >
      <dashboard-deploy-wallet />
    </div>

    <!-- IF USER DOES HAVE WALLET -->
    <div v-else>
      <dashboard-send-transactions />
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
        <h5 class="secondary text-bold text-center no-margin">Transactions</h5>
        <div class="text-caption text-italic text-center q-mb-xl">
          Note: Currently there is a limitation that all numbers have 18 decimals
        </div>

        <div class="row justify-evenly">
          <!-- Contract selection -->
          <div class="col q-mx-xs">
            <div class="q-my-sm">
              Target Contract
            </div>
            <div
              v-for="(contract, index) in selectedContracts"
              :key="index"
              class="q-my-md"
            >
              <q-select
                dark
                filled
                v-model="selectedContracts[index]"
                :options="contractOptions"
                label="Select contract"
              />
            </div>
          </div>
          <!-- Method selection -->
          <div class="col q-mx-xs">
            <div class="q-my-sm">
              Method
            </div>
            <div
              v-for="(contract, index) in selectedContracts"
              :key="index"
              class="q-my-md"
            >
              <q-select
                v-if="!selectedContracts[index]"
                v-model="selectedMethods[index]"
                disable
                dark
                filled
                :options="[]"
                label="Select method"
              />
              <q-select
                v-else
                v-model="selectedMethods[index]"
                dark
                filled
                :options="selectedContracts[index].abi.filter(method => method.type === 'function')"
                option-label="name"
                label="Select method"
              />
            </div>
          </div>
          <!-- Enter inputs -->
          <div class="col q-mx-xs">
            <div class="q-my-sm">
              Inputs, comma-separated
            </div>
            <div
              v-for="(contract, index) in selectedContracts"
              :key="index"
              class="q-my-md"
            >
              <base-input
                v-model="selectedInputs[index]"
                label="Enter Inputs"
                type="text"
              />
            </div>
          </div>
          <!-- Enter ETH value to send -->
          <div class="col q-mx-xs">
            <div class="q-my-sm">
              ETH Value to Send
            </div>
            <div
              v-for="(contract, index) in selectedContracts"
              :key="index"
              class="q-my-md"
            >
              <base-input
                v-model.number="selectedValues[index]"
                label="Enter ETH Amount"
                type="number"
              />
            </div>
          </div>
          <!-- Revert choice -->
          <div class="col q-mx-xs">
            <div class="q-my-sm">
              Revert on Failure?
            </div>
            <div
              v-for="(contract, index) in selectedContracts"
              :key="index"
              class="q-my-md"
            >
              <q-select
                v-model="selectedReverts[index]"
                dark
                filled
                :options="revertOptions"
                label="Select option"
              />
            </div>
          </div>
        </div>

        <!-- Button to add new row -->
        <div
          class="q-ml-xs cursor-pointer"
          @click="addTransaction"
        >
          <q-icon
            color="secondary"
            left
            name="fas fa-plus-circle"
          />
          <span class="secondary text-uppercase">
            Add Transaction
          </span>
        </div>

        <!-- Send batched transactions -->
        <div class="text-center">
          <base-button
            @click="sendAllTransactions"
            class="q-my-xl"
            label="Send Transactions"
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
/* eslint-disable global-require */
import { mapState } from 'vuex';
import { ethers } from 'ethers';
import ConnectWallet from 'components/ConnectWallet';
import DashboardDeployWallet from 'components/DashboardDeployWallet';
import DashboardSendTransactions from 'components/DashboardSendTransactions';
import helpers from 'src/mixins/helpers';

const addresses = require('../../../addresses.json');

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
      //
      contractOptions: [
        {
          label: 'Dai',
          value: 'dai',
          abi: require('../../../abi/dai.json'),
          address: addresses.dai,
        },
        {
          label: 'cDai',
          value: 'cdai',
          abi: require('../../../abi/cdai.json'),
          address: addresses.cdai,
        },
        {
          label: 'PoolTogether',
          value: 'pool',
          abi: require('../../../abi/pool.json'),
          address: addresses.pool,
        },
        {
          label: 'Uniswap',
          value: 'uniswap',
          abi: require('../../../abi/uniswap.json'),
          address: addresses.uniswap,
        },
      ],
      revertOptions: [{ label: 'True', value: true }, { label: 'False', value: 'false' }],
      selectedContracts: [undefined],
      selectedMethods: [undefined],
      selectedInputs: [undefined],
      selectedValues: [undefined],
      selectedReverts: [undefined],
    };
  },

  computed: {
    ...mapState({
      web3: (state) => state.main.web3,
      provider: (state) => state.main.provider,
      ethersProvider: (state) => state.main.ethersProvider,
      signer: (state) => state.main.signer,
      balances: (state) => state.main.balances,
      addresses: (state) => state.main.contracts.addresses,
      factory: (state) => state.main.contracts.factory, // ethers
      factoryContract: (state) => state.main.contracts.factoryContract, // web3 meta-tx
      wallet: (state) => state.main.contracts.wallet, // ethers
      walletContract: (state) => state.main.contracts.walletContract, // web3 meta-tx
      walletAddress: (state) => state.main.walletAddress,
      userAddress: (state) => state.main.userAddress,
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
    DashboardDeployWallet,
    DashboardSendTransactions,
  },

  methods: {

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
      console.log(4);
      this.web3.currentProvider.send(
        {
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_signTypedData_v4',
          params: [this.userAddress, dataToSign],
        },
        async (error, response) => {
          if (error || (response && response.error)) {
            console.log(4.1);
            this.showError(error);
            this.isLoading = false;
          } else if (response && response.result) {
            console.log(4.2);
            const { r, s, v } = this.getSignatureParameters(response.result);
            console.log(4.3);
            await this.sendTransaction(contract, this.userAddress, functionData, r, s, v);
          }
        },
      );
    },

    async sendTransaction(contract, userAddress, functionData, r, s, v) {
      const { web3 } = this;
      console.log(5);
      if (web3 && contract) {
        console.log(6);
        try {
          // const gasLimit = await contract.methods
          //   .executeMetaTransaction(userAddress, functionData, r, s, v)
          //   .estimateGas({ from: userAddress });

          console.log(7);
          const gasPrice = await web3.eth.getGasPrice();

          console.log(8);
          const tx = contract.methods
            .executeMetaTransaction(userAddress, functionData, r, s, v)
            .send({
              from: userAddress,
              gasPrice: web3.utils.toHex(gasPrice),
              gasLimit: web3.utils.toHex('3000000'),
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

    formatNumber(number, decimals = 2) {
      if (!number) return '-';
      return Number(number).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    },

    addTransaction() {
      this.selectedContracts.push(undefined);
    },

    deleteLastRow() {
      // TODO
    },

    /**
     * @notice Sends batched transactions
     * @dev TODO this function currently does not work!!!
     */
    async sendAllTransactions() {
      this.isLoading = true;
      const calls = [];
      console.log(0);
      for (let i = 0; i < this.selectedContracts.length; i += 1) {
        // Get address and ABI of selected contract
        const { address, abi } = this.selectedContracts[i];

        // Parse out some parameters
        const value = ethers.utils.parseEther(String(this.selectedValues[i]));
        const shouldRevert = this.selectedReverts[i].value;

        // Format function input data
        const inputs = this.selectedInputs[i].split(',');
        const parsedInputs = inputs.map((input) => {
          const trimmed = input.trim();
          // If hex string, leave value alone
          if (trimmed.startsWith('0x')) return trimmed;
          // If number, scale number
          if (!Number.isNaN(Number(trimmed))) return ethers.utils.parseEther(trimmed).toString();
          return trimmed;
        });

        console.log(1);
        // Generate encoded data
        const contract = new this.web3.eth.Contract(abi, address);
        const method = this.selectedMethods[i].name;
        console.log(parsedInputs);
        const encodedData = contract.methods[method](...parsedInputs).encodeABI();

        // Add call to list of calls
        calls.push({
          target: address, callData: encodedData, value: value.toString(), shouldRevert,
        });
      }

      /* eslint-disable */
      // Send transactions
      console.log(2);
      const walletAbi = require('../../../build/contracts/CompreWallet.json').abi;
      console.log(calls);
      const tx = await this.walletContract.methods.aggregate(calls).send({ from: this.userAddress });
      console.log(tx);


      // EXITING HERE TO AVOID USING META-TX FOR NOW
      return;

      const contract = this.walletContract;
      const functionData = contract.methods.aggregate(calls).encodeABI(); // does not work
      // const functionData = this.wallet.interface.encodeFunctionData('aggregate', calls);
      const message = await this.getMessage(this.wallet, functionData);

      const domainData = {
        name: 'CompreWallet',
        chainId: 42, // Kovan
        version: '1',
        verifyingContract: this.walletAddress,
      };
      const dataToSign = this.getDataToSign(domainData, message);
      console.log(3);
      await this.sendMetaTransaction(contract, dataToSign);
    },
  },
};
</script>
