<template>
  <q-layout
    view="hhh Lpr fff"
    class="main-content"
  >
    <q-header class="transparent">
      <div class="row justify-between items-center no-wrap">
        <div class="col-auto">
          <!-- LOGO AND TITLE -->
          <div
            class="row justify-start items-center q-pa-lg"
            style="cursor: pointer;"
            @click="$router.push({ name: 'home' })"
          >
            <img
              alt="CompreWallet logo"
              class="q-ml-md"
              src="statics/undraw_wallet_aym5.png"
              style="max-width: 100px;"
            >
            <div class="text-h6 light header">CompreWallet</div>
          </div>
        </div>

        <!-- ADDRESS AND SETTINGS -->
        <div class="col-auto q-mr-lg">
          <div class="row justify-end items-center q-mt-xs">
            <div
              v-if="userAddress"
              class="cursor-pointer"
              @click="showAccountDetails=true"
            >
              <div>
                <q-icon
                  left
                  name="fas fa-user-cog"
                />
                View Account
              </div>
            </div>
            <div v-else>
              <!--  -->
            </div>
          </div>
        </div>
      </div>
    </q-header>

    <!-- MAIN CONTENT -->
    <q-page-container>
      <router-view />
    </q-page-container>

    <!-- ACCOUNT DETAILS -->
    <q-dialog v-model="showAccountDetails">
      <q-card class="bg-primarydark">
        <q-card-section class="q-mt-lg q-px-xl">
          <div class="text-h5 text-bold">
            Account Info
          </div>
        </q-card-section>

        <q-card-section class="column text-left q-px-xl">
          <div class="q-mt-md">
            <div class="text-caption text-grey">
              Account Address
            </div>
            {{ userAddress }}
          </div>
          <div class="q-mt-md">
            <div class="text-caption text-grey">
              Contract Wallet Address
            </div>
            {{ walletAddress }}
          </div>
        </q-card-section>

        <q-card-actions
          align="right"
          class="q-ma-lg"
        >
          <q-btn
            v-close-popup
            flat
            label="Close"
            color="primary"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'BaseLayout',

  data() {
    return {
      showAccountDetails: false,
    };
  },

  computed: {
    ...mapState({
      userAddress: (state) => state.main.userAddress,
      walletAddress: (state) => state.main.walletAddress,
    }),
  },
};
</script>

<style lang="sass" scoped>
.transparent
  // opacity: 1

.main-content
  background-image: linear-gradient(to bottom right, $primarydark, $primarylight)
</style>
