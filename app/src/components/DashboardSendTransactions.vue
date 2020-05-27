<template>
  <div>
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
          <div class="text-left text-uppercase text-caption q-my-sm">
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
          <div class="text-left text-uppercase text-caption q-my-sm">
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
          <div class="text-left text-uppercase text-caption q-my-sm">
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
        <!-- Revert choice -->
        <div class="col q-mx-xs">
          <div class="text-left text-uppercase text-caption q-my-sm">
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
        class="cursor-pointer text-left q-ml-xs"
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
          :loading="isLoading"
          label="Send Transactions"
        />
      </div>
    </div>

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
/* eslint-disable global-require */
import { mapState } from 'vuex';
import { ethers } from 'ethers';
import biconomy from 'src/mixins/biconomy';

const addresses = require('../../../addresses.json');

export default {
  name: 'DashboardSendTransactions',

  mixins: [biconomy],

  data() {
    return {
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
      // selectedValues: [undefined], // value transfer currently not supported
      selectedReverts: [undefined],
    };
  },

  computed: {
    ...mapState({
      balances: (state) => state.main.balances,
      signer: (state) => state.main.signer,
      wallet: (state) => state.main.contracts.wallet, // ethers instance with signer
      walletAddress: (state) => state.main.walletAddress,
      walletContract: (state) => state.main.contracts.walletContract,
    }),
  },

  methods: {
    addTransaction() {
      this.selectedContracts.push(undefined);
    },

    async sendAllTransactions() {
      this.isLoading = true;

      // Specify contract we are calling
      const contract = this.walletContract;

      // Configure array of calls
      const calls = [];
      for (let i = 0; i < this.selectedContracts.length; i += 1) {
        // Get address and ABI of selected contract
        const { address, abi } = this.selectedContracts[i];

        // Parse out some parameters
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

        // Generate encoded data
        const selectedContract = new this.web3.eth.Contract(abi, address);
        const method = this.selectedMethods[i].name;
        const encodedData = selectedContract.methods[method](...parsedInputs).encodeABI();

        // Add call to list of calls
        calls.push({
          target: address, callData: encodedData, value: '0', shouldRevert,
        });
      }

      // Get encoded function data
      const functionData = this.wallet.interface.encodeFunctionData('aggregate', [calls]);

      // Define message user needs to sign
      const message = await this.getMessage(contract, functionData);

      // Configure EIP712 data blob
      const to = this.walletAddress;
      const domainData = {
        name: 'CompreWallet',
        chainId: 42, // Kovan
        version: '1',
        verifyingContract: to,
      };
      const dataToSign = this.getDataToSign(domainData, message);

      // Get user's signature and send tx
      const apiId = '5eceee77f4c7383464b7c5ab';
      await this.sendMetaTransaction(to, apiId, dataToSign);

      // const overrides = { gasLimit: 2000000 };
      // const tx = await this.wallet.aggregate(calls, overrides); // this works
      // await tx.wait();
      // console.log('done');
    },

    formatNumber(number, decimals = 2) {
      if (!number) return '-';
      return Number(number).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
      });
    },
  },
};
</script>
