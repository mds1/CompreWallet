const { accounts, contract, provider } = require('@openzeppelin/test-environment');
const { constants, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const ethers = require('ethers');
const addresses = require('../addresses.json');

const abi = {
  /* eslint-disable global-require */
  dai: require('../abi/dai.json'),
  cdai: require('../abi/cdai.json'),
  pool: require('../abi/pool.json'),
  /* eslint-enable global-require */
};

// Define constants and helpers
const MAX_UINT256 = constants.MAX_UINT256.toString();
const { parseEther } = ethers.utils;
const tokenHolder = process.env.TOKEN_HOLDER;

// Get contract instances of external contracts
const ethersProvider = new ethers.providers.Web3Provider(provider);
const dai = new ethers.Contract(addresses.dai, abi.dai, ethersProvider.getSigner(tokenHolder));

// Get our contracts
const CompreWallet = contract.fromArtifact('CompreWallet');

describe('CompreWallet', () => {
  const [deployer, user, user2, user3] = accounts;
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
  it('enables batched calls', async () => {
    // Send Dai to the user's wallet
    const walletAddress = compreWallet.address;
    const depositAmount = parseEther('100');
    await dai.transfer(walletAddress, depositAmount);
    expect((await dai.balanceOf(walletAddress)).toString()).to.equal(depositAmount.toString());

    // Generate ethers.js instance of the contract (since this is what we use on the frontend)
    const compreWalletE = new ethers.Contract(
      walletAddress,
      compreWallet.abi,
      ethersProvider.getSigner(user),
    );

    // Send multiple state-changing calls
    const transferAmount = parseEther('10');
    const calls = [
      // Transfer Dai to someone
      [addresses.dai, dai.interface.encodeFunctionData('transfer', [user2, transferAmount]), '0', true],
      // Approve PoolTogether contract to spend our Dai
      [addresses.dai, dai.interface.encodeFunctionData('approve', [addresses.pool, MAX_UINT256]), '0', true],
      // Approve cDAI contract to spend our Dai
      [addresses.dai, dai.interface.encodeFunctionData('approve', [addresses.cdai, MAX_UINT256]), '0', true],
    ];
    const tx = await compreWalletE.aggregate(calls);
    const receipt = await tx.wait();

    // Ensure results are what we expected
    expect((await dai.balanceOf(user2)).toString()).to.equal(transferAmount.toString());
    expect((await dai.allowance(walletAddress, addresses.pool)).toString()).to.equal(MAX_UINT256);
    expect((await dai.allowance(walletAddress, addresses.cdai)).toString()).to.equal(MAX_UINT256);
  });

  it('only lets the owner send batched calls', async () => {
    //
  });

  it('reverts on a failed call', async () => {
    // Send Dai to the user's wallet
    const walletAddress = compreWallet.address;
    const depositAmount = parseEther('100');
    await dai.transfer(walletAddress, depositAmount);
    expect((await dai.balanceOf(walletAddress)).toString()).to.equal(depositAmount.toString());

    // Generate ethers.js instance of the contract (since this is what we use on the frontend)
    const compreWalletE = new ethers.Contract(
      walletAddress,
      compreWallet.abi,
      ethersProvider.getSigner(user),
    );

    // Send call that will fail
    const transferAmount = parseEther('1000');
    const calls = [
      [addresses.dai, dai.interface.encodeFunctionData('transfer', [user2, transferAmount]), '0', true],
    ];
    await expectRevert(compreWalletE.aggregate(calls), 'CompreWallet: Call failed');
  });

  it('lets user prevent failed calls from reverting', async () => {
    // Send Dai to the user's wallet
    const walletAddress = compreWallet.address;
    const depositAmount = parseEther('100');
    await dai.transfer(walletAddress, depositAmount);
    expect((await dai.balanceOf(walletAddress)).toString()).to.equal(depositAmount.toString());

    // Generate ethers.js instance of the contract (since this is what we use on the frontend)
    const compreWalletE = new ethers.Contract(
      walletAddress,
      compreWallet.abi,
      ethersProvider.getSigner(user),
    );

    // Send call that will fail
    const transferAmount = parseEther('1000');
    const transferAmount2 = parseEther('10');
    const calls = [
      // This will revert but be ignored
      [addresses.dai, dai.interface.encodeFunctionData('transfer', [user3, transferAmount]), '0', false],
      // This will succeed
      [addresses.dai, dai.interface.encodeFunctionData('transfer', [user3, transferAmount2]), '0', true],
    ];
    const tx = await compreWalletE.aggregate(calls);
    const receipt = await tx.wait();

    // First transfer of 1000 Dai should fail but second transfer of 10 Dai should succeed
    expect((await dai.balanceOf(user3)).toString()).to.equal(transferAmount2.toString());
  });
});
