// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PLSToken (Private Liquid Staking Token)
 * @notice ERC20 token representing staked positions in the Private Liquid Staking protocol
 * @dev Only the PrivateStaking contract can mint/burn tokens
 */
contract PLSToken is ERC20, Ownable {
    address public stakingContract;

    error OnlyStakingContract();
    error ZeroAddress();

    modifier onlyStakingContract() {
        if (msg.sender != stakingContract) revert OnlyStakingContract();
        _;
    }

    constructor() ERC20("Private Liquid Staking Token", "PLS") Ownable(msg.sender) {}

    /**
     * @notice Set the staking contract address (can only be set once)
     * @param _stakingContract Address of the PrivateStaking contract
     */
    function setStakingContract(address _stakingContract) external onlyOwner {
        if (_stakingContract == address(0)) revert ZeroAddress();
        stakingContract = _stakingContract;
    }

    /**
     * @notice Mint PLS tokens to a user
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyStakingContract {
        _mint(to, amount);
    }

    /**
     * @notice Burn PLS tokens from a user
     * @param from Address to burn from
     * @param amount Amount to burn
     */
    function burn(address from, uint256 amount) external onlyStakingContract {
        _burn(from, amount);
    }
}
