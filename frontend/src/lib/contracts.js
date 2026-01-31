import { ethers } from 'ethers'
import PrivateStakingABI from '../contracts/PrivateStaking.json'
import PLSTokenABI from '../contracts/PLSToken.json'

// Contract addresses (will be set after deployment)
const CONTRACTS = {
  privateStaking: import.meta.env.VITE_PRIVATE_STAKING_ADDRESS || '',
  plsToken: import.meta.env.VITE_PLS_TOKEN_ADDRESS || '',
  stakingAsset: import.meta.env.VITE_STAKING_ASSET_ADDRESS || '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH Arbitrum Mainnet
}

/**
 * Get PrivateStaking contract instance
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {ethers.Contract}
 */
export const getPrivateStakingContract = (signer) => {
  if (!CONTRACTS.privateStaking) {
    throw new Error('PrivateStaking contract address not configured')
  }
  return new ethers.Contract(CONTRACTS.privateStaking, PrivateStakingABI.abi, signer)
}

/**
 * Get PLSToken contract instance
 * @param {ethers.Signer|ethers.Provider} signerOrProvider - Ethereum signer or provider
 * @returns {ethers.Contract}
 */
export const getPLSTokenContract = (signerOrProvider) => {
  if (!CONTRACTS.plsToken) {
    throw new Error('PLSToken contract address not configured')
  }
  return new ethers.Contract(CONTRACTS.plsToken, PLSTokenABI.abi, signerOrProvider)
}

/**
 * Get staking asset (WETH) contract instance
 * @param {ethers.Signer} signer - Ethereum signer
 * @returns {ethers.Contract}
 */
export const getStakingAssetContract = (signer) => {
  const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
  ]
  return new ethers.Contract(CONTRACTS.stakingAsset, ERC20_ABI, signer)
}

/**
 * Stake tokens with privacy protection
 * @param {ethers.Signer} signer - User's signer
 * @param {string} amount - Amount in ETH (e.g., "1.5")
 * @param {string} salt - Salt for commitment (bytes32 hex string)
 * @returns {Object} Transaction result with commitment
 */
export const stakeWithCommitment = async (signer, amount, salt) => {
  try {
    const privateStaking = getPrivateStakingContract(signer)
    const stakingAsset = getStakingAssetContract(signer)
    
    const amountWei = ethers.parseEther(amount)
    const address = await signer.getAddress()
    
    // Check balance
    const balance = await stakingAsset.balanceOf(address)
    if (balance < amountWei) {
      throw new Error(`Insufficient balance. You have ${ethers.formatEther(balance)} WETH`)
    }
    
    // Check and approve if needed
    const allowance = await stakingAsset.allowance(address, CONTRACTS.privateStaking)
    if (allowance < amountWei) {
      console.log('Approving WETH...')
      const approveTx = await stakingAsset.approve(CONTRACTS.privateStaking, ethers.MaxUint256)
      await approveTx.wait()
      console.log('WETH approved')
    }
    
    // Calculate commitment locally for verification
    const commitment = ethers.keccak256(
      ethers.solidityPacked(
        ['uint256', 'bytes32', 'address'],
        [amountWei, salt, address]
      )
    )
    
    // Stake with commitment
    console.log('Staking with commitment...')
    const tx = await privateStaking.stake(amountWei, salt)
    const receipt = await tx.wait()
    
    // Get commitment from event
    const stakedEvent = receipt.logs.find(log => {
      try {
        const parsed = privateStaking.interface.parseLog(log)
        return parsed.name === 'Staked'
      } catch {
        return false
      }
    })
    
    let eventCommitment = commitment
    if (stakedEvent) {
      const parsed = privateStaking.interface.parseLog(stakedEvent)
      eventCommitment = parsed.args.commitment
    }
    
    return {
      success: true,
      commitment: eventCommitment,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    }
  } catch (error) {
    console.error('Staking error:', error)
    throw new Error(`Staking failed: ${error.message}`)
  }
}

/**
 * Unstake tokens by revealing commitment
 * @param {ethers.Signer} signer - User's signer
 * @param {string} amount - Original staked amount in ETH
 * @param {string} salt - Original salt used for commitment
 * @returns {Object} Transaction result
 */
export const unstakeWithReveal = async (signer, amount, salt) => {
  try {
    const privateStaking = getPrivateStakingContract(signer)
    const amountWei = ethers.parseEther(amount)
    
    // Verify commitment exists
    const address = await signer.getAddress()
    const commitment = ethers.keccak256(
      ethers.solidityPacked(
        ['uint256', 'bytes32', 'address'],
        [amountWei, salt, address]
      )
    )
    
    const exists = await privateStaking.stakeCommitments(commitment)
    if (!exists) {
      throw new Error('Commitment not found. Check your amount and salt.')
    }
    
    console.log('Unstaking...')
    const tx = await privateStaking.unstake(amountWei, salt)
    const receipt = await tx.wait()
    
    return {
      success: true,
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      amount: ethers.formatEther(amountWei),
    }
  } catch (error) {
    console.error('Unstaking error:', error)
    throw new Error(`Unstaking failed: ${error.message}`)
  }
}

/**
 * Get PLS token balance
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {string} address - User address
 * @returns {string} Balance in ETH format
 */
export const getPLSBalance = async (provider, address) => {
  try {
    const plsToken = getPLSTokenContract(provider)
    const balance = await plsToken.balanceOf(address)
    return ethers.formatEther(balance)
  } catch (error) {
    console.error('Error getting PLS balance:', error)
    return '0'
  }
}

/**
 * Get total staked amount (public)
 * @param {ethers.Provider} provider - Ethereum provider
 * @returns {string} Total staked in ETH format
 */
export const getTotalStaked = async (provider) => {
  try {
    if (!CONTRACTS.privateStaking) return '0'
    
    // Create a fresh provider to bypass cache
    const freshProvider = new ethers.JsonRpcProvider('https://arb1.arbitrum.io/rpc')
    
    const privateStaking = new ethers.Contract(
      CONTRACTS.privateStaking,
      PrivateStakingABI.abi,
      freshProvider
    )
    const total = await privateStaking.totalStaked()
    return ethers.formatEther(total)
  } catch (error) {
    console.error('Error getting total staked:', error)
    return '0'
  }
}

/**
 * Get user's commitments
 * @param {ethers.Provider} provider - Ethereum provider
 * @param {string} address - User address
 * @returns {Array<string>} Array of commitment hashes
 */
export const getUserCommitments = async (provider, address) => {
  try {
    if (!CONTRACTS.privateStaking) return []
    const privateStaking = new ethers.Contract(
      CONTRACTS.privateStaking,
      PrivateStakingABI.abi,
      provider
    )
    
    const commitments = []
    let index = 0
    
    // Try to fetch commitments (will throw when index out of bounds)
    while (true) {
      try {
        const commitment = await privateStaking.userCommitments(address, index)
        commitments.push(commitment)
        index++
      } catch {
        break
      }
    }
    
    return commitments
  } catch (error) {
    console.error('Error getting user commitments:', error)
    return []
  }
}

/**
 * Check if contracts are configured
 * @returns {boolean}
 */
export const areContractsConfigured = () => {
  return Boolean(CONTRACTS.privateStaking && CONTRACTS.plsToken)
}

export { CONTRACTS }
