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

    <!-- IF READY TO USE -->
    <div v-else>
      <h5 class="text-center">Balances</h5>
      <h5 class="text-center">Transactions</h5>

    </div>
  </q-page>
</template>

<script>
import { mapState } from 'vuex';
import ConnectWallet from 'components/ConnectWallet';

export default {
  name: 'Dashboard',

  computed: {
    ...mapState({
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
  },
};
</script>
