<template>
  <div>
    It looks like this is your first visit. Deploy your contract wallet to get started!
    <base-button
      label="Deploy Wallet"
      @click="deployWallet"
    />

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
  </div>
</template>

<script>
import { mapState } from 'vuex';
import helpers from 'src/mixins/helpers';

export default {
  name: 'DashboardDeployWallet',

  mixins: [helpers],

  data() {
    return {
      isLoading: undefined,
      txHash: undefined,
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
      addresses: (state) => state.main.contracts.addresses,
      ethersProvider: (state) => state.main.ethersProvider,
      factoryContract: (state) => state.main.contracts.factoryContract,
      provider: (state) => state.main.provider,
      userAddress: (state) => state.main.userAddress,
      web3: (state) => state.main.web3,
    }),
  },

  methods: {
    /**
     * @notice Get message to sign
     */
    async getMessage(web3Contract, functionData) {
      const nonce = parseInt(await web3Contract.methods.getNonce(this.userAddress).call(), 10);
      console.log('nonce: ', nonce);
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
     * @notice Break signature into its r,s,v components
     */
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

    /**
     * @notice Send transaction request to API for relaying
     */
    async relayTransaction(functionData, r, s, v) {
      const to = this.addresses.compreWalletFactory;
      const apiId = '5ece63aaf4c7383464b7c57e';
      const params = [this.userAddress, functionData, r, s, v];
      const from = this.userAddress;
      const res = await this.$biconomyApi.post('/api/v2/meta-tx/native', {
        to, apiId, params, from,
      });
      console.log('res: ', res);

      if (res.status === 200) {
        this.txHash = res.data.txHash;
        await this.ethersProvider.waitForTransaction(this.txHash);
        await this.$store.dispatch('main/setEthereumData', this.provider);
        this.notifyUser('positive', 'Your transaction was successfully sent!');
        this.txHash = undefined; // signals to UI that transaction is complete
        this.isLoading = false;
      } else {
        this.showError(res);
      }
    },

    /**
     * @notice Get EIP712 signature from user and send meta-transaction
     */
    async sendMetaTransaction(contract, dataToSign) {
      const functionData = JSON.parse(dataToSign).message.functionSignature;

      // Get signature
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
            // Signature obtained, so parse out components
            const { r, s, v } = this.getSignatureParameters(response.result);
            await this.relayTransaction(functionData, r, s, v);
          }
        },
      );
    },

    /**
     * @notice Deploy user's wallet on first visit
     */
    async deployWallet() {
      this.isLoading = true;

      // Specify contract we are calling
      const contract = this.factoryContract;

      // Get encoded function data
      const logicAddress = this.addresses.compreWallet;
      const functionData = contract.methods.createContract(logicAddress).encodeABI();

      // Define message user needs to sign
      const message = await this.getMessage(contract, functionData);

      // Configure EIP712 data blob
      const domainData = {
        name: 'CompreWalletFactory',
        chainId: 42, // Kovan
        version: '1',
        verifyingContract: this.addresses.compreWalletFactory,
      };
      const dataToSign = this.getDataToSign(domainData, message);

      // Get user's signature and send tx
      await this.sendMetaTransaction(contract, dataToSign);


      // const contract = this.factoryContract;
      // const logicAddress = this.addresses.compreWallet;
      // const functionData = contract.methods.createContract(logicAddress).encodeABI();
      // const message = await this.getMessage(this.factory, functionData);

      // const domainData = {
      //   name: 'CompreWalletFactory',
      //   chainId: 42, // Kovan
      //   version: '1',
      //   verifyingContract: this.addresses.compreWalletFactory,
      // };
      // const dataToSign = this.getDataToSign(domainData, message);

      // await this.sendMetaTransaction(contract, dataToSign);
    },
  },

};
</script>
