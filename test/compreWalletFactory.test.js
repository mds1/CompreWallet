const { accounts, contract } = require('@openzeppelin/test-environment');
const { expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const CompreWalletFactory = contract.fromArtifact('CompreWalletFactory');
const CompreWallet = contract.fromArtifact('CompreWallet');

describe('CompreWalletFactory', () => {
  const [admin, user] = accounts;

  let compreWalletFactory;
  let compreWalletLogic;

  beforeEach(async () => {
    // Deploy factory
    compreWalletFactory = await CompreWalletFactory.new({ from: admin });

    // Deploy and initialize logic contract
    compreWalletLogic = await CompreWallet.new({ from: admin });
    await compreWalletLogic.initializeWallet(admin, { from: admin });
  });

  // Deployment and Initialization =================================================================
  it('should see the deployed CompreWalletFactory contract', async () => {
    expect(compreWalletFactory.address.startsWith('0x')).to.be.true;
    expect(compreWalletFactory.address.length).to.equal(42);
  });

  it('properly initializes an empty list of users', async () => {
    const users = await compreWalletFactory.getUsers();
    expect(users).to.be.an('array').that.is.empty;
  });

  // Main functionality ============================================================================
  it('properly deploys and configures proxy contracts', async () => {
    // Deploy contract
    const receipt = await compreWalletFactory.createContract({ from: user });

    // Get instance of the newly deployed proxy
    const walletAddress = await compreWalletFactory.getContract(user);
    const wallet = await CompreWallet.at(walletAddress);
    expectEvent(receipt, 'WalletCreated', {
      wallet: walletAddress,
    });
    expect(await wallet.owner()).to.be.equal(user);
  });
});
