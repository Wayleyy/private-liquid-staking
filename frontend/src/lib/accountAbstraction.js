import { BiconomySmartAccountV2, DEFAULT_ENTRYPOINT_ADDRESS } from "@biconomy/account"
import { Bundler } from "@biconomy/bundler"
import { BiconomyPaymaster } from "@biconomy/paymaster"
import { ethers } from 'ethers'

// Biconomy configuration for Arbitrum
const BICONOMY_CONFIG = {
  bundlerUrl: process.env.VITE_BICONOMY_BUNDLER_URL || 'https://bundler.biconomy.io/api/v2/42161/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44',
  paymasterUrl: process.env.VITE_BICONOMY_PAYMASTER_URL || '',
  chainId: 42161, // Arbitrum One
}

/**
 * Initialize Biconomy Smart Account for gasless transactions
 * @param {ethers.Signer} signer - User's EOA signer
 * @returns {BiconomySmartAccountV2} Smart account instance
 */
export const initSmartAccount = async (signer) => {
  try {
    console.log('Initializing Biconomy Smart Account...')
    
    const bundler = new Bundler({
      bundlerUrl: BICONOMY_CONFIG.bundlerUrl,
      chainId: BICONOMY_CONFIG.chainId,
      entryPointAddress: DEFAULT_ENTRYPOINT_ADDRESS,
    })
    
    let paymaster
    if (BICONOMY_CONFIG.paymasterUrl) {
      paymaster = new BiconomyPaymaster({
        paymasterUrl: BICONOMY_CONFIG.paymasterUrl,
      })
    }
    
    const smartAccount = await BiconomySmartAccountV2.create({
      signer,
      chainId: BICONOMY_CONFIG.chainId,
      bundler,
      paymaster,
    })
    
    const smartAccountAddress = await smartAccount.getAccountAddress()
    console.log('Smart Account initialized:', smartAccountAddress)
    
    return smartAccount
  } catch (error) {
    console.error('Failed to initialize Smart Account:', error)
    throw error
  }
}

/**
 * Execute a gasless transaction using Account Abstraction
 * @param {BiconomySmartAccountV2} smartAccount - Smart account instance
 * @param {Object} transaction - Transaction object { to, data, value }
 * @returns {Object} Transaction result with userOpHash and txHash
 */
export const executeGaslessTransaction = async (smartAccount, transaction) => {
  try {
    console.log('Preparing gasless transaction...')
    
    // Build user operation
    const userOp = await smartAccount.buildUserOp([transaction])
    
    console.log('User operation built:', userOp)
    
    // Send user operation
    const userOpResponse = await smartAccount.sendUserOp(userOp)
    
    console.log('User operation sent:', userOpResponse.userOpHash)
    
    // Wait for transaction to be mined
    const transactionDetails = await userOpResponse.wait()
    
    console.log('Transaction mined:', transactionDetails.receipt.transactionHash)
    
    return {
      userOpHash: userOpResponse.userOpHash,
      txHash: transactionDetails.receipt.transactionHash,
      success: transactionDetails.success,
    }
  } catch (error) {
    console.error('Gasless transaction failed:', error)
    throw error
  }
}

/**
 * Execute gasless stake transaction
 * @param {BiconomySmartAccountV2} smartAccount - Smart account instance
 * @param {string} stakingContractAddress - PrivateStaking contract address
 * @param {string} amount - Amount to stake (in wei)
 * @param {string} salt - Random salt for commitment
 * @returns {Object} Transaction result
 */
export const gaslessStake = async (smartAccount, stakingContractAddress, amount, salt) => {
  try {
    // Encode stake function call
    const stakingInterface = new ethers.Interface([
      'function stake(uint256 amount, bytes32 salt) external returns (bytes32 commitment)'
    ])
    
    const data = stakingInterface.encodeFunctionData('stake', [amount, salt])
    
    const transaction = {
      to: stakingContractAddress,
      data,
      value: 0,
    }
    
    return await executeGaslessTransaction(smartAccount, transaction)
  } catch (error) {
    console.error('Gasless stake failed:', error)
    throw error
  }
}

/**
 * Execute gasless unstake transaction
 * @param {BiconomySmartAccountV2} smartAccount - Smart account instance
 * @param {string} stakingContractAddress - PrivateStaking contract address
 * @param {string} amount - Amount to unstake
 * @param {string} salt - Salt used for commitment
 * @returns {Object} Transaction result
 */
export const gaslessUnstake = async (smartAccount, stakingContractAddress, amount, salt) => {
  try {
    const stakingInterface = new ethers.Interface([
      'function unstake(uint256 amount, bytes32 salt) external'
    ])
    
    const data = stakingInterface.encodeFunctionData('unstake', [amount, salt])
    
    const transaction = {
      to: stakingContractAddress,
      data,
      value: 0,
    }
    
    return await executeGaslessTransaction(smartAccount, transaction)
  } catch (error) {
    console.error('Gasless unstake failed:', error)
    throw error
  }
}

/**
 * Check if Account Abstraction is configured
 * @returns {boolean}
 */
export const isAAConfigured = () => {
  return Boolean(BICONOMY_CONFIG.bundlerUrl)
}

/**
 * Get Smart Account address for a given EOA
 * @param {ethers.Signer} signer - User's EOA signer
 * @returns {string} Smart account address
 */
export const getSmartAccountAddress = async (signer) => {
  try {
    const smartAccount = await initSmartAccount(signer)
    return await smartAccount.getAccountAddress()
  } catch (error) {
    console.error('Failed to get smart account address:', error)
    return null
  }
}

/**
 * Batch multiple transactions into a single user operation
 * @param {BiconomySmartAccountV2} smartAccount - Smart account instance
 * @param {Array} transactions - Array of transaction objects
 * @returns {Object} Transaction result
 */
export const executeBatchGaslessTransactions = async (smartAccount, transactions) => {
  try {
    console.log(`Batching ${transactions.length} transactions...`)
    
    const userOp = await smartAccount.buildUserOp(transactions)
    const userOpResponse = await smartAccount.sendUserOp(userOp)
    const transactionDetails = await userOpResponse.wait()
    
    console.log('Batch transaction mined:', transactionDetails.receipt.transactionHash)
    
    return {
      userOpHash: userOpResponse.userOpHash,
      txHash: transactionDetails.receipt.transactionHash,
      success: transactionDetails.success,
    }
  } catch (error) {
    console.error('Batch gasless transaction failed:', error)
    throw error
  }
}
