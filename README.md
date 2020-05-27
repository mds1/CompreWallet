# CompreWallet

The comprehensive Ethereum smart contract wallet that can do anything.

## Overview

- [Video demo](https://youtu.be/2e64UvbU3rc)
  - Towards the end video recording was cut off for some reason, so [here](https://kovan.etherscan.io/tx/0x1ebf9a522b04c89734dcc5e564f37be96d031bd1b13a055b3b597d0d82bdcc0f) is the last transaction shown in the video. You can see cDAI was minted, and we entered PoolTogether (plDAI is minted weekly, which is why it's not visible in Etherscan)

This tool provides you with a smart contract wallet that supports the following:

- Interact with any contract on Ethereum
- Batch any combination of transactions (as long as it's within the block gas limit) so
  they are sent within the same transaction. This saves time and gas!
- Integration with [Biconomy](https://biconomy.io/) for meta-transaction support&mdash;ETH for gas is not needed.

## Workflow

This section will describe the workflow from a user's perspective along with relevant implementation details.

1. Login with your web3 wallet
   1. This can be any web3 wallet, but for this demo only MetaMask support was added
2. On your first login, deploy your contract wallet
   1. There is a factory contract, `CompreWalletFactory`, that stores a mapping of user addresses to their contract wallets. Upon login, you will be prompted to deploy your contract wallet if you do not have one.
   2. After clicking "Deploy Wallet", you will be prompted for an EIP-712 signature. This signature, along with other required function data, will be relayed via the Biconomy API so Biconomy can call the `createContract` method of `CompreWalletFactory.sol` to deploy your contract wallet.
3. Click "View Account" in the top right and it will show the web3 address and contract wallet address associated with your account.
4. After logging in, you will be redirected to the dashboard. The top half shows a few token balances, and the bottom half lets you compose any combination of contract calls into a single, bundled transaction. For now, only a select few contracts and ABIs are populated.
   1. This section is currently a pretty poor user experience. You have to enter comma-separated arguments into the inputs box. An improvement would be functionality similar to [One Click dApp](https://oneclickdapp.com/) or [Drizzle](https://www.trufflesuite.com/drizzle), where the contract ABI is used to generate various individual input fields
   2. For each call, you can specify whether or not the full bundle of
5. After configuring your transaction, click "Send Transactions"
   1. This will parse the inputs and format the calldata, then the transaction will again be relayed via Biconomy
   2. This will call the `aggregate` function of the user's `CompreWallet` contract
   3. _Note: The meta-transaction relay here currently does not work, and the Biconomy team is investigating this issue_

## Development Setup

Create a file at the project root called .env with the following contents:

```bash
INFURA_ID=yourInfuraId
TOKEN_HOLDER=0x425249Cf0F2f91f488E24cF7B1AA3186748f7516
MNEMONIC="your mnemonic here"
```

Here, TOKEN_HOLDER is simply an account with a lot of Dai and other tokens used for testing on against a forked Kovan.

Next, run cd app and create a file called .env.dev with the following contents:

```bash
INFURA_ID=yourInfuraId
BICONOMY_API_KEY=yourBiconomyApiKey
```

For production deployment, create a file similar to the above but called and .env.prod with the same contents but different API keys.

Now, from the project root install dependencies as follows:

```bash
npm install
cd app
npm install
```

### Run App

From the project root run:

```bash
cd app
npm run dev
```

### Run Tests

From the project root run:

```bash
npm run test
```

## Deployment

1. Compile the contracts with `npm run compile`
2. Make sure your MNEMONIC is set in `.env`
3. Run `npx oz accounts` to confirm the right address would be used for deployment
4. Run `npm run deploy-contracts` and follow the prompts to deploy `CompreWalletFactory.sol`
5. From the app, login and deploy a wallet for your MetaMask account
6. Now that both contracts are deployed, we must configure our settings in the Biconomy Dashboard to ensure meta-transactions are properly relayed. Please see the [Biconomy documentation](https://docs.biconomy.io/) for details on how to do this. Note that you must setup a meta-transaction API endpoint for both the factory contract and your specific contract wallet.
   1. An improvement upon this would be to let users interact with their contract wallet through the factory contract, similar to how it is done [here](https://github.com/mds1/PoolTogether-Onboarding/blob/4304890945bbd858416d6dd9f96cbfaf1187baa5/contracts/UserPoolFactory.sol#L82). This would enable us to only need one API endpoint instead of setting up a new one for each contract, which of course is not very practical.

Done! There will now be a file called `.openzeppelin/<network>.json` which contains deployment info for the contracts. Be sure not to delete that file. This file should be committed to the repository.

For `CompreWallet.sol`, the `initializeWallet()` function can be replaced with a regular constructor if desired. The initializer function was used because the factory contract was originally configured to deploy minimal proxy wallets. However, it was discovered that for some reason minimal proxies are incompatible with the Biconomy framework, as the nonce is not properly read or updated. As a result, signature verification fails when relaying a meta-transaction, so the factory contract now uses ordinary deployment.
