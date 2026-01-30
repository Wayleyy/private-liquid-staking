// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/PLSToken.sol";
import "../src/PrivateStaking.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    constructor() ERC20("Mock Token", "MTK") {
        _mint(msg.sender, 1_000_000 * 10**18);
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}

contract PrivateStakingTest is Test {
    PLSToken public plsToken;
    PrivateStaking public privateStaking;
    MockERC20 public stakingAsset;

    address public alice = makeAddr("alice");
    address public bob = makeAddr("bob");
    address public teeOracle = makeAddr("teeOracle");

    uint256 constant STAKE_AMOUNT = 100 * 10**18;

    function setUp() public {
        // Deploy mock staking asset
        stakingAsset = new MockERC20();

        // Deploy PLS token
        plsToken = new PLSToken();

        // Deploy PrivateStaking
        privateStaking = new PrivateStaking(
            address(stakingAsset),
            address(plsToken)
        );

        // Set staking contract on PLS token
        plsToken.setStakingContract(address(privateStaking));

        // Set TEE oracle
        privateStaking.setTEEOracle(teeOracle);

        // Fund test accounts
        stakingAsset.mint(alice, 1000 * 10**18);
        stakingAsset.mint(bob, 1000 * 10**18);
    }

    function test_Stake() public {
        bytes32 salt = keccak256("alice_salt_1");

        vm.startPrank(alice);
        stakingAsset.approve(address(privateStaking), STAKE_AMOUNT);

        bytes32 commitment = privateStaking.stake(STAKE_AMOUNT, salt);
        vm.stopPrank();

        // Verify commitment exists
        assertTrue(privateStaking.verifyCommitment(commitment));

        // Verify PLS tokens minted
        assertEq(plsToken.balanceOf(alice), STAKE_AMOUNT);

        // Verify total staked
        assertEq(privateStaking.totalStaked(), STAKE_AMOUNT);

        // Verify user commitment count
        assertEq(privateStaking.getUserCommitmentCount(alice), 1);
    }

    function test_Unstake() public {
        bytes32 salt = keccak256("alice_salt_1");

        // First stake
        vm.startPrank(alice);
        stakingAsset.approve(address(privateStaking), STAKE_AMOUNT);
        bytes32 commitment = privateStaking.stake(STAKE_AMOUNT, salt);

        uint256 balanceBefore = stakingAsset.balanceOf(alice);

        // Then unstake by revealing commitment
        privateStaking.unstake(STAKE_AMOUNT, salt);
        vm.stopPrank();

        // Verify commitment removed
        assertFalse(privateStaking.verifyCommitment(commitment));

        // Verify PLS tokens burned
        assertEq(plsToken.balanceOf(alice), 0);

        // Verify tokens returned
        assertEq(stakingAsset.balanceOf(alice), balanceBefore + STAKE_AMOUNT);

        // Verify total staked updated
        assertEq(privateStaking.totalStaked(), 0);
    }

    function test_MultipleStakes() public {
        bytes32 salt1 = keccak256("alice_salt_1");
        bytes32 salt2 = keccak256("alice_salt_2");

        vm.startPrank(alice);
        stakingAsset.approve(address(privateStaking), STAKE_AMOUNT * 2);

        bytes32 commitment1 = privateStaking.stake(STAKE_AMOUNT, salt1);
        bytes32 commitment2 = privateStaking.stake(STAKE_AMOUNT, salt2);
        vm.stopPrank();

        // Verify both commitments exist
        assertTrue(privateStaking.verifyCommitment(commitment1));
        assertTrue(privateStaking.verifyCommitment(commitment2));

        // Verify commitment count
        assertEq(privateStaking.getUserCommitmentCount(alice), 2);

        // Verify total PLS
        assertEq(plsToken.balanceOf(alice), STAKE_AMOUNT * 2);
    }

    function test_RevertOnDuplicateCommitment() public {
        bytes32 salt = keccak256("alice_salt_1");

        vm.startPrank(alice);
        stakingAsset.approve(address(privateStaking), STAKE_AMOUNT * 2);

        privateStaking.stake(STAKE_AMOUNT, salt);

        // Same amount + salt = same commitment, should revert
        vm.expectRevert(PrivateStaking.CommitmentAlreadyExists.selector);
        privateStaking.stake(STAKE_AMOUNT, salt);
        vm.stopPrank();
    }

    function test_RevertOnInvalidUnstake() public {
        bytes32 salt = keccak256("wrong_salt");

        vm.prank(alice);
        vm.expectRevert(PrivateStaking.CommitmentNotFound.selector);
        privateStaking.unstake(STAKE_AMOUNT, salt);
    }

    function test_RevertOnZeroStake() public {
        bytes32 salt = keccak256("alice_salt_1");

        vm.prank(alice);
        vm.expectRevert(PrivateStaking.ZeroAmount.selector);
        privateStaking.stake(0, salt);
    }

    function test_CommitmentPrivacy() public {
        bytes32 salt1 = keccak256("secret_salt_1");
        bytes32 salt2 = keccak256("secret_salt_2");

        // Alice and Bob stake different amounts with different salts
        vm.startPrank(alice);
        stakingAsset.approve(address(privateStaking), 50 * 10**18);
        bytes32 commitmentAlice = privateStaking.stake(50 * 10**18, salt1);
        vm.stopPrank();

        vm.startPrank(bob);
        stakingAsset.approve(address(privateStaking), 150 * 10**18);
        bytes32 commitmentBob = privateStaking.stake(150 * 10**18, salt2);
        vm.stopPrank();

        // Commitments are different (privacy preserved)
        assertTrue(commitmentAlice != commitmentBob);

        // Cannot derive amounts from commitments alone
        // Only the user with the salt can reveal their stake
    }
}
