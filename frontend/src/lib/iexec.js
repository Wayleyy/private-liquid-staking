import { IExecDataProtector } from '@iexec/dataprotector'
import { ethers } from 'ethers'

// iExec configuration
const IEXEC_CONFIG = {
  // iApp address (will be set after deployment)
  iappAddress: process.env.VITE_IAPP_ADDRESS || '',
  // TEE Oracle address (from contract)
  teeOracleAddress: process.env.VITE_TEE_ORACLE_ADDRESS || '',
}

/**
 * Initialize iExec DataProtector
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {IExecDataProtector} DataProtector instance
 */
export const initDataProtector = async (signer) => {
  try {
    const dataProtector = new IExecDataProtector(signer)
    return dataProtector
  } catch (error) {
    console.error('Failed to initialize DataProtector:', error)
    throw error
  }
}

/**
 * Calculate rewards confidentially in TEE
 * @param {ethers.Signer} signer - User's signer
 * @param {Object} stakeData - Stake data { amount, stakeTimestamp, userAddress }
 * @param {number} baseAPY - Base APY in basis points
 * @returns {Object} Reward calculation result with TEE proof
 */
export const calculateRewardsInTEE = async (signer, stakeData, baseAPY = 520) => {
  try {
    console.log('Initiating TEE computation for rewards...')
    
    const dataProtector = await initDataProtector(signer)
    
    // Prepare input for iApp
    const input = {
      action: 'calculate_rewards',
      stakeData: {
        amount: stakeData.amount,
        stakeTimestamp: stakeData.stakeTimestamp,
        userAddress: stakeData.userAddress
      },
      currentTimestamp: Math.floor(Date.now() / 1000),
      baseAPY
    }
    
    // Execute computation in TEE
    const result = await dataProtector.processData({
      app: IEXEC_CONFIG.iappAddress,
      data: JSON.stringify(input),
      // Protect result - only user can decrypt
      protectResult: true
    })
    
    console.log('TEE computation completed:', result)
    
    return {
      rewards: result.rewards,
      proofHash: result.proofHash,
      taskId: result.taskId,
      teeProof: result.proof
    }
  } catch (error) {
    console.error('TEE computation failed:', error)
    throw new Error(`Failed to calculate rewards in TEE: ${error.message}`)
  }
}

/**
 * Verify commitment in TEE without revealing amount
 * @param {ethers.Signer} signer - User's signer
 * @param {string} commitment - Commitment hash
 * @param {Object} revealData - { amount, salt, userAddress }
 * @returns {boolean} Whether commitment is valid
 */
export const verifyCommitmentInTEE = async (signer, commitment, revealData) => {
  try {
    console.log('Verifying commitment in TEE...')
    
    const dataProtector = await initDataProtector(signer)
    
    const input = {
      action: 'verify_commitment',
      commitment,
      revealData
    }
    
    const result = await dataProtector.processData({
      app: IEXEC_CONFIG.iappAddress,
      data: JSON.stringify(input),
      protectResult: true
    })
    
    return result.valid
  } catch (error) {
    console.error('TEE verification failed:', error)
    throw new Error(`Failed to verify commitment in TEE: ${error.message}`)
  }
}

/**
 * Generate aggregate proof for privacy metrics
 * @param {ethers.Signer} signer - User's signer
 * @param {Array} stakes - Array of stake data
 * @returns {Object} Aggregate proof
 */
export const generateAggregateProofInTEE = async (signer, stakes) => {
  try {
    console.log('Generating aggregate proof in TEE...')
    
    const dataProtector = await initDataProtector(signer)
    
    const input = {
      action: 'aggregate_proof',
      stakes
    }
    
    const result = await dataProtector.processData({
      app: IEXEC_CONFIG.iappAddress,
      data: JSON.stringify(input),
      protectResult: false // Aggregate data can be public
    })
    
    return {
      totalAmount: result.totalAmount,
      commitmentsHash: result.commitmentsHash,
      stakeCount: result.stakeCount
    }
  } catch (error) {
    console.error('TEE aggregate proof failed:', error)
    throw new Error(`Failed to generate aggregate proof: ${error.message}`)
  }
}

/**
 * Mock TEE computation for testing (when iApp not deployed)
 * @param {Object} stakeData - Stake data
 * @param {number} baseAPY - Base APY
 * @returns {Object} Mock result
 */
export const mockTEEComputation = (stakeData, baseAPY = 520) => {
  const currentTimestamp = Math.floor(Date.now() / 1000)
  const timeStaked = currentTimestamp - stakeData.stakeTimestamp
  const SECONDS_PER_YEAR = 365 * 24 * 60 * 60
  
  const rewards = Math.floor(
    (stakeData.amount * baseAPY * timeStaked) / (10000 * SECONDS_PER_YEAR)
  )
  
  const proofHash = ethers.keccak256(
    ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'uint256', 'uint256'],
      [stakeData.userAddress, rewards, currentTimestamp]
    )
  )
  
  return {
    rewards,
    proofHash,
    taskId: 'mock-task-' + Date.now(),
    teeProof: '0x' + '00'.repeat(32),
    isMock: true
  }
}

/**
 * Check if iExec TEE is configured
 * @returns {boolean}
 */
export const isTEEConfigured = () => {
  return Boolean(IEXEC_CONFIG.iappAddress && IEXEC_CONFIG.teeOracleAddress)
}
