import { ethers } from 'ethers';
import Web3 from 'web3';
import Biconomy from '@biconomy/mexa';

const addresses = require('../../../../addresses.json');
addresses.compreWallet = require('../../../../.openzeppelin/kovan.json').proxies['comprewallet/CompreWallet'][0].address;
addresses.compreWalletFactory = require('../../../../.openzeppelin/kovan.json').proxies['comprewallet/CompreWalletFactory'][0].address;

/* eslint-disable */
const abi = {
  compreWallet: require('../../../../build/contracts/CompreWallet.json').abi,
  CompreWalletFactory: require('../../../../build/contracts/CompreWalletFactory.json').abi,
};
/* eslint-enable */

export async function setEthereumData({ commit }, provider) {
  // Get user's wallet info from provider
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const userAddress = await signer.getAddress();
  const walletAddress = undefined;

  const biconomy = new Biconomy(provider, { apiKey: process.env.BICONOMY_API_KEY });
  const web3 = new Web3(biconomy);

  const contracts = {
    addresses,
  };

  commit('setWallet', {
    signer, provider, ethersProvider, userAddress, walletAddress, biconomy, contracts, web3,
  });
}
