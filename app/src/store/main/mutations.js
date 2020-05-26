
export function setWallet(state, wallet) {
  state.signer = wallet.signer;
  state.provider = wallet.provider;
  state.ethersProvider = wallet.ethersProvider;
  state.userAddress = wallet.userAddress;
  state.walletAddress = wallet.walletAddress;
  state.biconomy = wallet.biconomy;
  state.web3 = wallet.web3;

  state.balances = {};
  state.balances = wallet.balances;

  state.contracts.factory = wallet.contracts.factory;
  state.contracts.factoryContract = wallet.contracts.factoryContract;
  state.contracts.addresses = wallet.contracts.addresses;
}
