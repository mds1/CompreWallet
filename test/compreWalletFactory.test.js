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
  it.skip('properly deploys and configures proxy contracts', async () => {
    /**
     * @dev Initialization of the deployed proxy contract fails when testing with the ganache-cli
     * `--fork` feature. See the linked issue for details:
     *     https://github.com/trufflesuite/ganache-core/issues/526
     * Note that this test does pass in production even though it fails here.
     */

    // Deploy contract directly instead of using GSN
    const receipt = await compreWalletFactory.createContract(compreWalletLogic.address, { from: user });

    // Get instance of the newly deployed proxy
    const proxyAddress = await compreWalletFactory.getContract(user);
    const proxy = await CompreWallet.at(proxyAddress);
    expectEvent(receipt, 'ProxyCreated', {
      proxy: proxyAddress,
    });
    expect(await proxy.owner()).to.be.equal(user);
  });

  it.skip('enables users to interact with their proxy via the factory', async () => {
    /**
     * @dev This test is incomplete as it fails due to the same error as above. Similarly,
     * this test does pass in production
     */

    // Deploy contract directly instead of using GSN
    const receipt = await compreWalletFactory.createContract(compreWalletLogic.address, { from: user });
  });
});
