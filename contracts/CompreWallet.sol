// SPDX-License-Identifier: MIT
pragma solidity ^0.6.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";


contract CompreWallet is Initializable {
  /**
   * @notice The user will be the contract owner
   */
  address public owner;

  /**
   * @notice Emitted when ownership is transferred
   */
  event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

  /**
   * @notice Only let user call a function, either directly or via the GSN-enabled factory
   */
  modifier onlyOwner() {
    require(owner == msg.sender, "CompreWallet: Caller not authorized");
    _;
  }

  /**
   * @notice Replaces constructor to facilitate transition to deployment as minimal proxies
   * @param _user The user who this contract is for
   */
  function initializeWallet(address _user) external initializer {
    emit OwnershipTransferred(address(0), _user);
    owner = _user;
  }

  /**
   * @notice Transfer ownership to a new address
   */
  function transferOwnership(address _newOwner) external onlyOwner {
    emit OwnershipTransferred(owner, _newOwner);
    owner = _newOwner;
  }
}
