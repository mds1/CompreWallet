
import Vue from 'vue';
import axios from 'axios';

// Configure and export Biconomy API property
const biconomyApi = axios.create({
  baseURL: 'https://api.biconomy.io',
  headers: { 'x-api-key': process.env.BICONOMY_API_KEY },
});

// Access outside Vue files with `import { biconomyApi } from 'boot/axios'`
export { biconomyApi };

// Access within vue files via this.$biconomyApi
Vue.prototype.$biconomyApi = biconomyApi;
