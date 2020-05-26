const { accounts, contract, provider } = require('@openzeppelin/test-environment');
const { constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethers = require('ethers');
const addresses = require('../addresses.json');

const abi = {
  /* eslint-disable global-require */
  dai: require('../abi/dai.json'),
  cdai: require('../abi/cdai.json'),
  /* eslint-enable global-require */
};

// Define constants and helpers
const MAX_UINT256 = constants.MAX_UINT256.toString();
const { parseEther } = ethers.utils;
const tokenHolder = process.env.TOKEN_HOLDER;

// Get contract instances of external contracts
const ethersProvider = new ethers.providers.Web3Provider(provider);
const signer = ethersProvider.getSigner();
const dai = new ethers.Contract(addresses.dai, abi.dai, ethersProvider.getSigner(tokenHolder));

// Get our contracts
const CompreWallet = contract.fromArtifact('CompreWallet');

describe('CompreWallet', () => {
  const [deployer, user, user2] = accounts;
  let compreWallet;

  beforeEach(async () => {
    // Deploy new instance of user's wallet
    compreWallet = await CompreWallet.new({ from: deployer });
    await compreWallet.initializeWallet(user, { from: deployer });
  });

  // Deployment and Initialization =================================================================
  it('should see the deployed CompreWallet contract', async () => {
    expect(compreWallet.address.startsWith('0x')).to.be.true;
    expect(compreWallet.address.length).to.equal(42);
  });

  it('sets the user as the owner', async () => {
    expect(await compreWallet.owner()).to.equal(user);
  });

  it('only lets the initialize function be called once', async () => {
    await expectRevert(
      compreWallet.initializeWallet(user2, { from: user }),
      'Contract instance has already been initialized',
    );
  });

  it('does not anyone except the owner transfer ownership', async () => {
    await expectRevert(
      compreWallet.transferOwnership(user2, { from: user2 }),
      'CompreWallet: Caller not authorized',
    );
  });

  it('lets ownership be transferred by the owner', async () => {
    await compreWallet.transferOwnership(user2, { from: user });
    expect(await compreWallet.owner()).to.equal(user2);
  });


  // Main functionality ============================================================================
  // TODO
});
