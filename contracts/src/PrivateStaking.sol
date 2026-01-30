// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./PLSToken.sol";

/**
 * @title PrivateStaking
 * @notice Private Liquid Staking contract with confidential positions
 * @dev Uses commitments to hide stake amounts, iExec TEE for reward computation
 */
contract PrivateStaking is ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;

    // ============ State Variables ============

    PLSToken public immutable plsToken;
    IERC20 public immutable stakingAsset;
    
    // iExec TEE Oracle address for reward proofs
    address public teeOracle;
    
    // Total staked (public for APY calculation, but individual amounts hidden)
    uint256 public totalStaked;
    
    // Commitment scheme: hash(amount, salt, user) -> exists
    mapping(bytes32 => bool) public stakeCommitments;
    
    // User -> array of commitment hashes (for tracking without revealing amounts)
    mapping(address => bytes32[]) public userCommitments;
    
    // Reward claims verified by TEE
    mapping(bytes32 => bool) public claimedRewards;
    
    // Nonce for replay protection
    mapping(address => uint256) public nonces;

    // ============ Events ============

    event Staked(address indexed user, bytes32 indexed commitment, uint256 plsReceived);
    event Unstaked(address indexed user, bytes32 indexed commitment, uint256 amount);
    event RewardsClaimed(address indexed user, bytes32 indexed proofHash, uint256 amount);
    event TEEOracleUpdated(address indexed newOracle);

    // ============ Errors ============

    error ZeroAmount();
    error InvalidCommitment();
    error CommitmentAlreadyExists();
    error CommitmentNotFound();
    error InvalidProof();
    error AlreadyClaimed();
    error OnlyTEEOracle();
    error InvalidSignature();

    // ============ Modifiers ============

    modifier onlyTEEOracle() {
        if (msg.sender != teeOracle) revert OnlyTEEOracle();
        _;
    }

    // ============ Constructor ============

    constructor(address _stakingAsset, address _plsToken) Ownable(msg.sender) {
        stakingAsset = IERC20(_stakingAsset);
        plsToken = PLSToken(_plsToken);
    }

    // ============ Admin Functions ============

    /**
     * @notice Set the TEE Oracle address (iExec callback address)
     * @param _teeOracle New TEE oracle address
     */
    function setTEEOracle(address _teeOracle) external onlyOwner {
        teeOracle = _teeOracle;
        emit TEEOracleUpdated(_teeOracle);
    }

    // ============ Staking Functions ============

    /**
     * @notice Stake assets with a commitment to hide the amount
     * @param amount Amount to stake
     * @param salt Random salt for commitment
     * @return commitment The commitment hash
     * @dev User provides salt off-chain, stores it securely for later unstaking
     */
    function stake(uint256 amount, bytes32 salt) external nonReentrant returns (bytes32 commitment) {
        if (amount == 0) revert ZeroAmount();
        
        // Create commitment: hash(amount, salt, sender)
        commitment = keccak256(abi.encodePacked(amount, salt, msg.sender));
        
        if (stakeCommitments[commitment]) revert CommitmentAlreadyExists();
        
        // Transfer staking asset from user
        stakingAsset.safeTransferFrom(msg.sender, address(this), amount);
        
        // Store commitment
        stakeCommitments[commitment] = true;
        userCommitments[msg.sender].push(commitment);
        
        // Update total (amount is public in tx, but commitment hides future reference)
        totalStaked += amount;
        
        // Mint PLS tokens 1:1
        plsToken.mint(msg.sender, amount);
        
        emit Staked(msg.sender, commitment, amount);
    }

    /**
     * @notice Unstake by revealing commitment
     * @param amount Original staked amount
     * @param salt Original salt used
     * @dev User must remember their salt to unstake
     */
    function unstake(uint256 amount, bytes32 salt) external nonReentrant {
        bytes32 commitment = keccak256(abi.encodePacked(amount, salt, msg.sender));
        
        if (!stakeCommitments[commitment]) revert CommitmentNotFound();
        
        // Remove commitment
        stakeCommitments[commitment] = false;
        _removeCommitment(msg.sender, commitment);
        
        // Burn PLS tokens
        plsToken.burn(msg.sender, amount);
        
        // Update total
        totalStaked -= amount;
        
        // Transfer staking asset back
        stakingAsset.safeTransfer(msg.sender, amount);
        
        emit Unstaked(msg.sender, commitment, amount);
    }

    // ============ Reward Functions (TEE-verified) ============

    /**
     * @notice Claim rewards verified by iExec TEE
     * @param amount Reward amount (computed confidentially by TEE)
     * @param proofHash Hash of the TEE computation proof
     * @param signature TEE oracle signature
     */
    function claimRewards(
        uint256 amount,
        bytes32 proofHash,
        bytes calldata signature
    ) external nonReentrant {
        if (claimedRewards[proofHash]) revert AlreadyClaimed();
        
        // Verify TEE signature
        bytes32 messageHash = keccak256(abi.encodePacked(
            msg.sender,
            amount,
            proofHash,
            nonces[msg.sender],
            block.chainid,
            address(this)
        ));
        
        bytes32 ethSignedHash = keccak256(abi.encodePacked(
            "\x19Ethereum Signed Message:\n32",
            messageHash
        ));
        
        address signer = _recoverSigner(ethSignedHash, signature);
        if (signer != teeOracle) revert InvalidSignature();
        
        // Mark as claimed
        claimedRewards[proofHash] = true;
        nonces[msg.sender]++;
        
        // Mint reward tokens (or transfer from reward pool)
        plsToken.mint(msg.sender, amount);
        
        emit RewardsClaimed(msg.sender, proofHash, amount);
    }

    // ============ View Functions ============

    /**
     * @notice Get user's commitment count (not amounts)
     * @param user User address
     * @return Number of active commitments
     */
    function getUserCommitmentCount(address user) external view returns (uint256) {
        return userCommitments[user].length;
    }

    /**
     * @notice Verify a commitment exists
     * @param commitment Commitment hash
     * @return exists Whether the commitment exists
     */
    function verifyCommitment(bytes32 commitment) external view returns (bool exists) {
        return stakeCommitments[commitment];
    }

    // ============ Internal Functions ============

    function _removeCommitment(address user, bytes32 commitment) internal {
        bytes32[] storage commitments = userCommitments[user];
        for (uint256 i = 0; i < commitments.length; i++) {
            if (commitments[i] == commitment) {
                commitments[i] = commitments[commitments.length - 1];
                commitments.pop();
                break;
            }
        }
    }

    function _recoverSigner(bytes32 hash, bytes calldata signature) internal pure returns (address) {
        require(signature.length == 65, "Invalid signature length");
        
        bytes32 r;
        bytes32 s;
        uint8 v;
        
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        
        if (v < 27) v += 27;
        
        return ecrecover(hash, v, r, s);
    }
}
