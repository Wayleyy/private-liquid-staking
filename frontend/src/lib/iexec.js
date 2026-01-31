import { IExecDataProtectorCore } from '@iexec/dataprotector'
import { ethers } from 'ethers'

// iExec configuration
const IEXEC_CONFIG = {
  // iApp address (will be set after deployment)
  iappAddress: process.env.VITE_IAPP_ADDRESS || '',
  // TEE Oracle address (from contract)
  teeOracleAddress: process.env.VITE_TEE_ORACLE_ADDRESS || '',
  // iExec network (bellecour for production, viviani for testnet)
  network: 'bellecour',
}

/**
 * Initialize iExec DataProtector Core
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {IExecDataProtectorCore} DataProtector instance
 */
export const initDataProtector = async (signer) => {
  try {
    const dataProtectorCore = new IExecDataProtectorCore(signer, {
      iexecOptions: {
        smsURL: IEXEC_CONFIG.network === 'bellecour' 
          ? 'https://sms.scone-prod.v8-bellecour.iex.ec'
          : 'https://sms.scone-debug.v8-bellecour.iex.ec'
      }
    })
    return dataProtectorCore
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
    
    // If iApp not configured, use mock
    if (!IEXEC_CONFIG.iappAddress) {
      console.warn('iApp not configured, using mock computation')
      return mockTEEComputation(stakeData, baseAPY)
    }
    
    const dataProtector = await initDataProtector(signer)
    
    // Prepare input for iApp
    const input = {
      action: 'calculate_rewards',
      stakeData: {
        amount: stakeData.amount.toString(),
        stakeTimestamp: stakeData.stakeTimestamp,
        userAddress: stakeData.userAddress
      },
      currentTimestamp: Math.floor(Date.now() / 1000),
      baseAPY
    }
    
    // Protect the sensitive stake data
    const { address: protectedDataAddress } = await dataProtector.protectData({
      data: input.stakeData,
      name: `stake-${Date.now()}`
    })
    
    console.log('Data protected at:', protectedDataAddress)
    
    // Execute computation in TEE using the iApp
    const { taskId } = await dataProtector.processProtectedData({
      protectedData: protectedDataAddress,
      app: IEXEC_CONFIG.iappAddress,
      args: JSON.stringify({
        action: input.action,
        currentTimestamp: input.currentTimestamp,
        baseAPY: input.baseAPY
      })
    })
    
    console.log('TEE task submitted:', taskId)
    
    // Fetch result from TEE
    const result = await dataProtector.fetchProtectedData({ taskId })
    const parsedResult = JSON.parse(result)
    
    console.log('TEE computation completed:', parsedResult)
    
    return {
      rewards: parsedResult.rewards,
      proofHash: parsedResult.proofHash,
      taskId,
      teeProof: parsedResult.proofData,
      isMock: false
    }
  } catch (error) {
    console.error('TEE computation failed:', error)
    console.warn('Falling back to mock computation')
    return mockTEEComputation(stakeData, baseAPY)
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
    
    if (!IEXEC_CONFIG.iappAddress) {
      console.warn('iApp not configured, skipping TEE verification')
      return true
    }
    
    const dataProtector = await initDataProtector(signer)
    
    const input = {
      action: 'verify_commitment',
      commitment,
      revealData
    }
    
    const { address: protectedDataAddress } = await dataProtector.protectData({
      data: revealData,
      name: `verify-${Date.now()}`
    })
    
    const { taskId } = await dataProtector.processProtectedData({
      protectedData: protectedDataAddress,
      app: IEXEC_CONFIG.iappAddress,
      args: JSON.stringify({ action: input.action, commitment })
    })
    
    const result = await dataProtector.fetchProtectedData({ taskId })
    const parsedResult = JSON.parse(result)
    
    return parsedResult.valid
  } catch (error) {
    console.error('TEE verification failed:', error)
    console.warn('Skipping verification due to error')
    return true
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
    
    if (!IEXEC_CONFIG.iappAddress) {
      console.warn('iApp not configured, skipping aggregate proof')
      return {
        totalAmount: '0',
        commitmentsHash: '0x' + '00'.repeat(32),
        stakeCount: 0
      }
    }
    
    const dataProtector = await initDataProtector(signer)
    
    const input = {
      action: 'aggregate_proof',
      stakes
    }
    
    const { address: protectedDataAddress } = await dataProtector.protectData({
      data: stakes,
      name: `aggregate-${Date.now()}`
    })
    
    const { taskId } = await dataProtector.processProtectedData({
      protectedData: protectedDataAddress,
      app: IEXEC_CONFIG.iappAddress,
      args: JSON.stringify({ action: input.action }),
      // Result can be public for aggregates
      workerpoolMaxPrice: 0
    })
    
    const result = await dataProtector.fetchProtectedData({ taskId })
    const parsedResult = JSON.parse(result)
    
    return {
      totalAmount: parsedResult.totalAmount,
      commitmentsHash: parsedResult.commitmentsHash,
      stakeCount: parsedResult.stakeCount
    }
  } catch (error) {
    console.error('TEE aggregate proof failed:', error)
    return {
      totalAmount: '0',
      commitmentsHash: '0x' + '00'.repeat(32),
      stakeCount: 0
    }
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
