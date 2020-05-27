<template>
  <div>
    It looks like this is your first visit. Deploy your contract wallet to get started!
    <base-button
      label="Deploy Wallet"
      :loading="isLoading"
      @click="deployWallet"
    />

    <!-- IF A TRANSACTION IS PROCESSING -->
    <div
      v-if="isLoading"
      class="text-center q-mt-xl"
    >
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
import biconomy from 'src/mixins/biconomy';

export default {
  name: 'DashboardDeployWallet',

  mixins: [biconomy],

  computed: {
    ...mapState({
      factoryContract: (state) => state.main.contracts.factoryContract,
    }),
  },

  methods: {
    /**
     * @notice Deploy user's wallet on first visit
     */
    async deployWallet() {
      this.isLoading = true;

      // Specify contract we are calling
      const contract = this.factoryContract;

      // Get encoded function data
      const functionData = contract.methods.createContract().encodeABI();

      // Define message user needs to sign
      const message = await this.getMessage(contract, functionData);

      // Configure EIP712 data blob
      const to = this.addresses.compreWalletFactory;
      const domainData = {
        name: 'CompreWalletFactory',
        chainId: 42, // Kovan
        version: '1',
        verifyingContract: to,
      };
      const dataToSign = this.getDataToSign(domainData, message);

      // Get user's signature and send tx
      const apiId = '5ecede8799abbb7b87efed30';
      await this.sendMetaTransaction(to, apiId, dataToSign);
    },
  },

};
</script>
