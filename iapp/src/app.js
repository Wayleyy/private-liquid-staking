/**
 * Private Liquid Staking - iExec iApp
 * 
 * This iApp runs inside a TEE (Trusted Execution Environment) to:
 * 1. Calculate rewards confidentially based on stake commitments
 * 2. Generate proofs for reward claims without revealing amounts
 * 3. Verify stake positions without exposing individual balances
 */

import { IExecDataProtector } from '@iexec/dataprotector';
import { ethers } from 'ethers';
import crypto from 'crypto';

// Environment variables provided by iExec TEE
const IEXEC_OUT = process.env.IEXEC_OUT || '/iexec_out';
const IEXEC_IN = process.env.IEXEC_IN || '/iexec_in';

/**
 * Calculate staking rewards confidentially
 * @param {Object} stakeData - Encrypted stake data from user
 * @param {number} currentTimestamp - Current block timestamp
 * @param {number} baseAPY - Base APY in basis points (e.g., 500 = 5%)
 * @returns {Object} Reward calculation result with proof
 */
function calculateRewards(stakeData, currentTimestamp, baseAPY) {
    const { amount, stakeTimestamp, userAddress } = stakeData;
    
    // Calculate time staked in seconds
    const timeStaked = currentTimestamp - stakeTimestamp;
    
    // Calculate rewards: amount * (APY/10000) * (timeStaked / 365 days)
    const SECONDS_PER_YEAR = 365 * 24 * 60 * 60;
    const rewards = Math.floor(
        (amount * baseAPY * timeStaked) / (10000 * SECONDS_PER_YEAR)
    );
    
    // Generate proof hash
    const proofData = {
        userAddress,
        rewards,
        timestamp: currentTimestamp,
        nonce: crypto.randomBytes(32).toString('hex')
    };
    
    const proofHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'uint256', 'uint256', 'string'],
            [proofData.userAddress, proofData.rewards, proofData.timestamp, proofData.nonce]
        )
    );
    
    return {
        rewards,
        proofHash,
        proofData
    };
}

/**
 * Verify a stake commitment without revealing the amount
 * @param {bytes32} commitment - The commitment hash
 * @param {Object} revealData - Data to verify (amount, salt, user)
 * @returns {boolean} Whether the commitment is valid
 */
function verifyCommitment(commitment, revealData) {
    const { amount, salt, userAddress } = revealData;
    
    const computedCommitment = ethers.keccak256(
        ethers.solidityPacked(
            ['uint256', 'bytes32', 'address'],
            [amount, salt, userAddress]
        )
    );
    
    return commitment === computedCommitment;
}

/**
 * Generate aggregate proof for multiple stakes
 * Used for proving total stake without revealing individual positions
 * @param {Array} stakes - Array of stake data
 * @returns {Object} Aggregate proof
 */
function generateAggregateProof(stakes) {
    let totalAmount = 0n;
    const commitments = [];
    
    for (const stake of stakes) {
        totalAmount += BigInt(stake.amount);
        const commitment = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'bytes32', 'address'],
                [stake.amount, stake.salt, stake.userAddress]
            )
        );
        commitments.push(commitment);
    }
    
    // Merkle root of commitments (simplified)
    const commitmentsHash = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['bytes32[]'],
            [commitments]
        )
    );
    
    return {
        totalAmount: totalAmount.toString(),
        commitmentsHash,
        stakeCount: stakes.length
    };
}

/**
 * Sign reward claim for on-chain verification
 * @param {Object} rewardData - Reward claim data
 * @param {string} privateKey - TEE oracle private key
 * @returns {string} Signature
 */
async function signRewardClaim(rewardData, privateKey) {
    const { userAddress, amount, proofHash, nonce, chainId, contractAddress } = rewardData;
    
    const messageHash = ethers.keccak256(
        ethers.solidityPacked(
            ['address', 'uint256', 'bytes32', 'uint256', 'uint256', 'address'],
            [userAddress, amount, proofHash, nonce, chainId, contractAddress]
        )
    );
    
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));
    
    return signature;
}

/**
 * Main iApp entry point
 */
async function main() {
    console.log('Private Liquid Staking iApp - Starting TEE computation...');
    
    try {
        // Read input args (passed via iExec)
        const args = process.argv.slice(2);
        const inputArg = args[0] || '{}';
        
        let input;
        try {
            input = JSON.parse(inputArg);
        } catch {
            input = { action: 'calculate_rewards' };
        }
        
        const { action } = input;
        let result;
        
        switch (action) {
            case 'calculate_rewards': {
                const { stakeData, currentTimestamp, baseAPY } = input;
                result = calculateRewards(
                    stakeData || { amount: 1000000, stakeTimestamp: Date.now() - 86400000, userAddress: '0x0' },
                    currentTimestamp || Math.floor(Date.now() / 1000),
                    baseAPY || 500 // 5% APY
                );
                console.log('Rewards calculated:', result.rewards);
                break;
            }
            
            case 'verify_commitment': {
                const { commitment, revealData } = input;
                result = {
                    valid: verifyCommitment(commitment, revealData)
                };
                console.log('Commitment verification:', result.valid ? 'VALID' : 'INVALID');
                break;
            }
            
            case 'aggregate_proof': {
                const { stakes } = input;
                result = generateAggregateProof(stakes || []);
                console.log('Aggregate proof generated');
                break;
            }
            
            case 'bulk_calculate_rewards': {
                const { stakesData, currentTimestamp, baseAPY } = input;
                const timestamp = currentTimestamp || Math.floor(Date.now() / 1000);
                const apy = baseAPY || 500;
                
                if (!stakesData || !Array.isArray(stakesData)) {
                    result = { error: 'stakesData must be an array' };
                    break;
                }
                
                console.log(`Processing bulk rewards for ${stakesData.length} stakes...`);
                
                const bulkResults = stakesData.map((stakeData, index) => {
                    try {
                        const rewardResult = calculateRewards(stakeData, timestamp, apy);
                        console.log(`Stake ${index + 1}/${stakesData.length}: ${rewardResult.rewards} rewards`);
                        return {
                            userAddress: stakeData.userAddress,
                            rewards: rewardResult.rewards,
                            proofHash: rewardResult.proofHash,
                            proofData: rewardResult.proofData,
                            success: true
                        };
                    } catch (error) {
                        console.error(`Error processing stake ${index + 1}:`, error.message);
                        return {
                            userAddress: stakeData.userAddress,
                            error: error.message,
                            success: false
                        };
                    }
                });
                
                const successCount = bulkResults.filter(r => r.success).length;
                const totalRewards = bulkResults
                    .filter(r => r.success)
                    .reduce((sum, r) => sum + r.rewards, 0);
                
                result = {
                    bulkResults,
                    summary: {
                        total: stakesData.length,
                        successful: successCount,
                        failed: stakesData.length - successCount,
                        totalRewards
                    }
                };
                
                console.log(`Bulk processing complete: ${successCount}/${stakesData.length} successful`);
                break;
            }
            
            case 'bulk_verify_commitments': {
                const { commitments } = input;
                
                if (!commitments || !Array.isArray(commitments)) {
                    result = { error: 'commitments must be an array' };
                    break;
                }
                
                console.log(`Bulk verifying ${commitments.length} commitments...`);
                
                const verificationResults = commitments.map((item, index) => {
                    try {
                        const valid = verifyCommitment(item.commitment, item.revealData);
                        console.log(`Commitment ${index + 1}/${commitments.length}: ${valid ? 'VALID' : 'INVALID'}`);
                        return {
                            commitment: item.commitment,
                            userAddress: item.revealData.userAddress,
                            valid,
                            success: true
                        };
                    } catch (error) {
                        console.error(`Error verifying commitment ${index + 1}:`, error.message);
                        return {
                            commitment: item.commitment,
                            error: error.message,
                            success: false
                        };
                    }
                });
                
                const validCount = verificationResults.filter(r => r.success && r.valid).length;
                
                result = {
                    verificationResults,
                    summary: {
                        total: commitments.length,
                        valid: validCount,
                        invalid: verificationResults.filter(r => r.success && !r.valid).length,
                        errors: verificationResults.filter(r => !r.success).length
                    }
                };
                
                console.log(`Bulk verification complete: ${validCount}/${commitments.length} valid`);
                break;
            }
            
            default:
                result = {
                    message: 'Private Liquid Staking iApp ready',
                    supportedActions: [
                        'calculate_rewards',
                        'verify_commitment',
                        'aggregate_proof',
                        'bulk_calculate_rewards',
                        'bulk_verify_commitments'
                    ]
                };
        }
        
        // Write result to iExec output
        const fs = require('fs');
        const outputPath = `${IEXEC_OUT}/result.json`;
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        
        // Write computed.json for iExec
        const computedPath = `${IEXEC_OUT}/computed.json`;
        fs.writeFileSync(computedPath, JSON.stringify({
            'deterministic-output-path': outputPath
        }));
        
        console.log('TEE computation completed successfully');
        
    } catch (error) {
        console.error('Error in TEE computation:', error.message);
        process.exit(1);
    }
}

main();
