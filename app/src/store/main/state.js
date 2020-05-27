export default function () {
  return {
    // Wallet
    signer: undefined,
    provider: undefined,
    ethersProvider: undefined,
    userAddress: undefined,
    walletAddress: undefined,
    biconomy: undefined,
    web3: undefined,
    balances: {},
    contracts: {
      addresses: {},
      factory: undefined,
      factoryContract: undefined,
      wallet: undefined,
      walletContract: undefined,
    },
  };
}
