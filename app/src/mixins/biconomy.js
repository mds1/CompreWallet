/**
 * @notice This mixin contains boilerplate for sending meta-transactions with Biconomy
 * @dev See sample code at the URL below
 * https://github.com/bcnmy/metatx-standard/blob/master/example/react-ui/src/App.js
 */
import { mapState } from 'vuex';
import helpers from 'src/mixins/helpers';

const ethSigUtil = require('eth-sig-util');


export default {
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
      provider: (state) => state.main.provider,
      userAddress: (state) => state.main.userAddress,
      web3: (state) => state.main.web3,
    }),
  },

  methods: {
    /**
     * @notice Get message that user will sign
     */
    async getMessage(web3Contract, functionData) {
      const nonce = parseInt(await web3Contract.methods.getNonce(this.userAddress).call(), 10);
      return {
        nonce,
        from: this.userAddress,
        functionSignature: functionData,
      };
    },

    /**
     * @notice Returns the EIP712 formatted message
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
     * @notice Prompt user for signature and relay meta-transaction
     */
    async sendMetaTransaction(to, apiId, dataToSign) {
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
            const recovered = ethSigUtil.recoverTypedSignature_v4({
              data: JSON.parse(dataToSign),
              sig: response.result,
            });
            console.log(`Recovered ${recovered}`);
            await this.relayTransaction(to, apiId, functionData, r, s, v);
          }
        },
      );
    },

    /**
     * @notice Send transaction request to API for relaying
     */
    async relayTransaction(to, apiId, functionData, r, s, v) {
      const params = [this.userAddress, functionData, r, s, v];
      const from = this.userAddress;
      try {
        const res = await this.$biconomyApi.post('/api/v2/meta-tx/native', {
          to, apiId, params, from, gasLimit: 8000000,
        });

        if (res.status === 200) {
          this.txHash = res.data.txHash;
          await this.ethersProvider.waitForTransaction(this.txHash);
          await this.$store.dispatch('main/setEthereumData', this.provider); // update state
          this.notifyUser('positive', 'Your transaction was successfully sent!');
          this.txHash = undefined; // signals to UI that transaction is complete
          this.isLoading = false;
        } else {
          this.showError(res);
        }
      } catch (err) {
        this.showError(err);
      }
    },
  },
};
