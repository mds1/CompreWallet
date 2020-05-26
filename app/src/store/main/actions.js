import { ethers } from 'ethers';
import Biconomy from '@biconomy/mexa';

export async function setEthereumData({ commit }, provider) {
  // Get user's wallet info from provider
  const biconomy = new Biconomy(provider, { apiKey: process.env.BICONOMY_API_KEY });
  const ethersProvider = new ethers.providers.Web3Provider(biconomy);
  const signer = ethersProvider.getSigner();
  const userAddress = await signer.getAddress();
  const walletAddress = undefined;

  commit('setWallet', {
    signer, provider, ethersProvider, userAddress, walletAddress, biconomy,
  });
}
