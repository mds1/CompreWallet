import { ethers } from 'ethers';
import Web3 from 'web3';
import Biconomy from '@biconomy/mexa';
import { getTokensBalance } from '@mycrypto/eth-scan';

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

  // Define contracts available to all users
  const factory = new ethers.Contract(
    addresses.compreWalletFactory, abi.compreWalletFactory, ethersProvider,
  );
  const contracts = {
    addresses,
    factory, // this is an ethers, read-only version, the below is  web3 meta-tx version
    factoryContract: new web3.eth.Contract(abi.compreWalletFactory, addresses.compreWalletFactory),
  };

  // Check if user has a wallet deployed
  // For demo purposes, we currently have everyone use the same wallet
  const walletAddress = await factory.getContract(userAddress);
  // const walletAddress = '0x18F9aABC3DfF9325f18837c087077319deA3cA92';

  // If they do have a wallet, check token balances and create instances of it
  let balances;
  if (walletAddress !== ethers.constants.AddressZero) {
    // Get token balances
    const balancesByAddress = await getTokensBalance(ethersProvider, walletAddress, [
      addresses.dai,
      addresses.cdai,
    ]);
    balances = {
      DAI: formatEther(balancesByAddress[addresses.dai]),
      cDAI: formatUnits(balancesByAddress[addresses.cdai], 8),
    };

    // PoolTogether has multiple token states, so we check all of them here
    const poolAbi = ['function totalBalanceOf(address _addr) external view returns (uint256) '];
    const pool = new ethers.Contract(addresses.pool, poolAbi, ethersProvider);
    balances.plDAI = formatEther(await pool.totalBalanceOf(walletAddress));

    // Contract instances
    contracts.wallet = new ethers.Contract(walletAddress, abi.compreWallet, signer);
    contracts.walletContract = new web3.eth.Contract(abi.compreWallet, walletAddress);
  }

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
