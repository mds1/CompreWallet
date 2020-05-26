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
            <!-- <img
              alt="PoolTogether logo"
              class="q-ml-md"
              src="statics/pooltogether/white-logo@2x.png"
              style="max-width: 100px;"
            > -->
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
              <div style="font-size: 0.75rem">
                Logged in as
              </div>
              <div>
                {{ userAddress }}
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

  </q-layout>
</template>

<script>
import { mapState } from 'vuex';

export default {
  name: 'BaseLayout',

  data() {
    return {};
  },

  computed: {
    ...mapState({
      userAddress: (state) => state.main.userAddress,
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
