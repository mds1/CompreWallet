// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "./EIP712MetaTransaction.sol";
import "./CompreWallet.sol";


contract CompreWalletFactory is EIP712MetaTransaction("CompreWalletFactory", "1") {
  /**
   * @notice Store list of all users
   */
  address[] public users;

  /**
   * @notice Maps user => their contract
   */
  mapping(address => address) public getContract;

  /**
   * @notice Emitted when a new proxy is created
   * @param proxy Address of the new proxy
   */
  event ProxyCreated(address proxy);

  /**
   * @notice Called to deploy a clone of _target for _user
   * @param _target address of the underlying logic contract to delegate to
   */
  function createContract(address _target) external {
    // Contract user is the user who sent the meta-transaction
    address _user = msgSender();

    // Define function call to initialize the new ProvideLiquidity contract
    bytes memory _payload = abi.encodeWithSignature("initializeWallet(address)", _user);

    // Deploy proxy
    address _contract = deployMinimal(_target, _payload);

    // Update state
    users.push(_user);
    getContract[_user] = _contract;
  }

  /**
   * @notice Returns list of all user addresses
   */
  function getUsers() external view returns (address[] memory) {
    return users;
  }

  /**
   * @notice Deploys EIP-1167 minimal proxy based
   * @dev Copied from OpenZeppelin's ProxyFactory.sol since there is not yet a packaged
   * version of this contract for Solidity 0.6, see original at
   * https://github.com/OpenZeppelin/openzeppelin-sdk/blob/release/2.8/packages/lib/contracts/upgradeability/ProxyFactory.sol
   * @param _logic Address of the contract to delegatecall too
   * @param _data Calldata contract should execute after deployment
   */
  function deployMinimal(address _logic, bytes memory _data) internal returns (address proxy) {
    // Adapted from https://github.com/optionality/clone-factory/blob/32782f82dfc5a00d103a7e61a17a5dedbd1e8e9d/contracts/CloneFactory.sol
    bytes20 targetBytes = bytes20(_logic);
    assembly {
      let clone := mload(0x40)
      mstore(clone, 0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000)
      mstore(add(clone, 0x14), targetBytes)
      mstore(add(clone, 0x28), 0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000)
      proxy := create(0, clone, 0x37)
    }

    emit ProxyCreated(address(proxy));

    if (_data.length > 0) {
      (bool success, ) = proxy.call(_data);
      require(success);
    }
  }
}
