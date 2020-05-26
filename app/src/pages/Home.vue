<template>
  <q-page padding>
    <h1 class="text-center header q-pt-xl">
      The Wallet That Does it All
    </h1>

    <h3 class="text-center">
      Log in, deploy your wallet, then do anything
    </h3>

    <div class="text-center">
      <connect-wallet />
    </div>
  </q-page>
</template>

<script>
import ConnectWallet from 'src/components/ConnectWallet';

export default {
  name: 'Home',

  components: {
    ConnectWallet,
  },
};
</script>
