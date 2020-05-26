import { ethers } from 'ethers';
import Web3 from 'web3';
import Biconomy from '@biconomy/mexa';
import { getEtherBalances, getTokensBalance } from '@mycrypto/eth-scan';

const { formatEther, formatUnits } = ethers.utils;

const addresses = require('../../../../addresses.json');
addresses.compreWallet = require('../../../../.openzeppelin/kovan.json').proxies['comprewallet/CompreWallet'][0].address;
addresses.compreWalletFactory = require('../../../../.openzeppelin/kovan.json').proxies['comprewallet/CompreWalletFactory'][0].address;

/* eslint-disable */
const abi = {
  compreWallet: require('../../../../build/contracts/CompreWallet.json').abi,
  compreWalletFactory: require('../../../../build/contracts/CompreWalletFactory.json').abi,
};
/* eslint-enable */

export async function setEthereumData({ commit }, provider) {
  // Get user's wallet info from provider
  const ethersProvider = new ethers.providers.Web3Provider(provider);
  const signer = ethersProvider.getSigner();
  const userAddress = await signer.getAddress();

  // Get meta-tx enabled web3 instance
  const biconomy = new Biconomy(provider, { apiKey: process.env.BICONOMY_API_KEY });
  const web3 = new Web3(biconomy);

  // Check if user has a wallet deployed
  const factory = new ethers.Contract(
    addresses.compreWalletFactory, abi.compreWalletFactory, ethersProvider,
  );
  const walletAddress = await factory.getContract(userAddress);

  // If they do, check token balances
  let balances;
  if (walletAddress !== ethers.constants.AddressZero) {
    const balancesByAddress = await getTokensBalance(ethersProvider, userAddress, [
      addresses.dai,
      addresses.cdai,
      addresses.pool,
    ]);
    const ethBalance = await getEtherBalances(ethersProvider, [userAddress]);
    balances = {
      ETH: formatEther(ethBalance[userAddress]),
      DAI: formatEther(balancesByAddress[addresses.dai]),
      cDAI: formatUnits(balancesByAddress[addresses.cdai], 8),
      plDAI: formatEther(balancesByAddress[addresses.pool]),
    };
  }

  const contracts = {
    addresses,
    factory, // this is an ethers, read-only version, the below is  web3 meta-tx version
    factoryContract: new web3.eth.Contract(abi.compreWalletFactory, addresses.compreWalletFactory),
  };

  commit('setWallet', {
    signer,
    provider,
    ethersProvider,
    userAddress,
    walletAddress,
    biconomy,
    contracts,
    web3,
    balances,
  });
}
