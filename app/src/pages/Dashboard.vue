<template>
  <q-page padding>
    <h1 class="text-center header">
      Dashboard
    </h1>

    <div
      v-if="!userAddress"
      class="text-center"
    >
      Login with MetaMask to get started
      <connect-wallet />
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
    }),
  },

  components: {
    ConnectWallet,
  },
};
</script>
