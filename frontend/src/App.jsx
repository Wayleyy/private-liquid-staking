import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { Shield, Lock, Coins, TrendingUp, Eye, EyeOff, Wallet, ArrowRight, Menu, X, ChevronDown, Zap, Server, FileKey, CheckCircle } from 'lucide-react'
import { calculateRewardsInTEE, mockTEEComputation, isTEEConfigured } from './lib/iexec'
import { stakeWithCommitment, unstakeWithReveal, getPLSBalance, getTotalStaked, areContractsConfigured } from './lib/contracts'
import TransactionHistory from './components/TransactionHistory'
import PrivacyComparison from './components/PrivacyComparison'

function App() {
  const [connected, setConnected] = useState(false)
  const [account, setAccount] = useState('')
  const [provider, setProvider] = useState(null)
  const [signer, setSigner] = useState(null)
  const [stakeAmount, setStakeAmount] = useState('')
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [salt, setSalt] = useState('')
  const [activeTab, setActiveTab] = useState('stake')
  const [showPrivateData, setShowPrivateData] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [ethBalance, setEthBalance] = useState('0')
  const [plsBalance, setPlsBalance] = useState('0')
  const [teeStatus, setTeeStatus] = useState({ active: false, taskId: null })
  const [showTeeProof, setShowTeeProof] = useState(false)

  const mockData = {
    totalStaked: '2,847.32',
    yourStake: '***.**',
    yourStakeRevealed: '125.50',
    pendingRewards: '**.**',
    pendingRewardsRevealed: '2.45',
    apy: '5.2'
  }

  // Check if wallet is already connected on mount
  useEffect(() => {
    checkIfWalletIsConnected()
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged)
      window.ethereum.on('chainChanged', () => window.location.reload())
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
      }
    }
  }, [])

  // Update balances when account changes
  useEffect(() => {
    if (connected && account) {
      updateBalances()
    }
  }, [connected, account])

  const checkIfWalletIsConnected = async () => {
    try {
      if (!window.ethereum) return
      
      const accounts = await window.ethereum.request({ method: 'eth_accounts' })
      if (accounts.length > 0) {
        await connectWallet()
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error)
    }
  }

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      setConnected(false)
      setAccount('')
      setProvider(null)
      setSigner(null)
    } else {
      setAccount(accounts[0])
      updateBalances()
    }
  }

  const updateBalances = async () => {
    try {
      if (!provider || !account) return
      
      const balance = await provider.getBalance(account)
      setEthBalance(ethers.formatEther(balance))
      
      // Get PLS token balance from contract
      if (areContractsConfigured()) {
        const plsBalance = await getPLSBalance(provider, account)
        setPlsBalance(plsBalance)
      }
    } catch (error) {
      console.error('Error updating balances:', error)
    }
  }

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        alert('Please install MetaMask to use this app')
        return
      }

      setIsLoading(true)
      
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      })
      
      // Create provider and signer
      const web3Provider = new ethers.BrowserProvider(window.ethereum)
      const web3Signer = await web3Provider.getSigner()
      
      // Check network (Arbitrum Sepolia = 421614)
      const network = await web3Provider.getNetwork()
      if (network.chainId !== 421614n) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x66eee' }], // 421614 in hex
          })
        } catch (switchError) {
          // Chain not added, add it
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: '0x66eee',
                chainName: 'Arbitrum Sepolia',
                nativeCurrency: {
                  name: 'ETH',
                  symbol: 'ETH',
                  decimals: 18
                },
                rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://sepolia.arbiscan.io/']
              }]
            })
          } else {
            throw switchError
          }
        }
      }
      
      setProvider(web3Provider)
      setSigner(web3Signer)
      setAccount(accounts[0])
      setConnected(true)
      
      // Get balance
      const balance = await web3Provider.getBalance(accounts[0])
      setEthBalance(ethers.formatEther(balance))
      
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Failed to connect wallet: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnect = async () => {
    await connectWallet()
  }

  const handleStake = async () => {
    if (!stakeAmount || !signer) return
    
    try {
      setIsLoading(true)
      setTeeStatus({ active: true, taskId: null })
      
      // Generate salt for commitment
      const salt = ethers.hexlify(ethers.randomBytes(32))
      
      // Compute rewards in TEE (or mock if not configured)
      let teeResult
      if (isTEEConfigured()) {
        teeResult = await calculateRewardsInTEE(signer, {
          amount: ethers.parseEther(stakeAmount).toString(),
          stakeTimestamp: Math.floor(Date.now() / 1000),
          userAddress: account
        })
      } else {
        teeResult = mockTEEComputation({
          amount: Number(ethers.parseEther(stakeAmount)),
          stakeTimestamp: Math.floor(Date.now() / 1000),
          userAddress: account
        })
      }
      
      setTeeStatus({ active: true, taskId: teeResult.taskId })
      
      // Call contract stake function with commitment
      if (areContractsConfigured()) {
        const result = await stakeWithCommitment(signer, stakeAmount, salt)
        
        console.log('Staking successful!')
        console.log('Commitment:', result.commitment)
        console.log('TEE Proof:', teeResult.proofHash)
        console.log('Transaction:', result.txHash)
        
        // Save to transaction history
        saveTransaction({
          type: 'stake',
          commitment: result.commitment,
          amount: stakeAmount,
          txHash: result.txHash,
          teeTaskId: teeResult.taskId,
          timestamp: Date.now(),
          status: 'completed'
        })
        
        alert(`Staking successful!\n\nAmount: ${stakeAmount} WETH\nCommitment: ${result.commitment.slice(0, 10)}...\nTEE Task: ${teeResult.taskId}\n\n⚠️ SAVE YOUR SALT:\n${salt}\n\nYou will need this salt to unstake later!`)
        
        // Update balances
        await updateBalances()
      } else {
        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ['uint256', 'bytes32', 'address'],
            [ethers.parseEther(stakeAmount), salt, account]
          )
        )
        alert(`Demo Mode: Contracts not deployed\n\nCommitment: ${commitment.slice(0, 10)}...\nTEE Task: ${teeResult.taskId}\n\nSAVE YOUR SALT: ${salt}\n\nDeploy contracts to enable real staking.`)
      }
      
      setStakeAmount('')
      setShowTeeProof(true)
    } catch (error) {
      console.error('Error staking:', error)
      alert('Staking failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const saveTransaction = (tx) => {
    try {
      const key = `tx_history_${account}`
      const stored = localStorage.getItem(key)
      const history = stored ? JSON.parse(stored) : []
      history.push(tx)
      localStorage.setItem(key, JSON.stringify(history))
    } catch (error) {
      console.error('Error saving transaction:', error)
    }
  }

  const handleUnstake = async () => {
    if (!unstakeAmount || !salt || !signer) return
    
    try {
      setIsLoading(true)
      
      // Call contract unstake function
      if (areContractsConfigured()) {
        const result = await unstakeWithReveal(signer, unstakeAmount, salt)
        
        console.log('Unstaking successful!')
        console.log('Transaction:', result.txHash)
        console.log('Amount:', result.amount)
        
        // Calculate commitment for history
        const commitment = ethers.keccak256(
          ethers.solidityPacked(
            ['uint256', 'bytes32', 'address'],
            [ethers.parseEther(unstakeAmount), salt, account]
          )
        )
        
        // Save to transaction history
        saveTransaction({
          type: 'unstake',
          commitment,
          amount: unstakeAmount,
          txHash: result.txHash,
          timestamp: Date.now(),
          status: 'completed'
        })
        
        alert(`Unstaking successful!\n\nAmount: ${result.amount} WETH returned\nTransaction: ${result.txHash.slice(0, 10)}...\n\nYour commitment has been revealed and removed.`)
        
        // Update balances
        await updateBalances()
      } else {
        alert(`Demo Mode: Contracts not deployed\n\nUnstaking ${unstakeAmount} WETH\n\nDeploy contracts to enable real unstaking.`)
      }
      
      setUnstakeAmount('')
      setSalt('')
    } catch (error) {
      console.error('Error unstaking:', error)
      alert('Unstaking failed: ' + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen text-white overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-gray-800/50 sticky top-0 z-50 bg-dark/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-base sm:text-lg font-bold">Private Staking</span>
                <span className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">Powered by iExec TEE</span>
              </div>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-6">
              <nav className="flex items-center gap-6 text-sm text-gray-400">
                <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
                <a href="https://docs.iex.ec" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
              </nav>
              
              {connected ? (
                <div className="flex items-center gap-3">
                  <div className="glass px-3 py-1.5 rounded-lg text-sm text-gray-400">
                    {showPrivateData ? plsBalance : '***.**'} PLS
                  </div>
                  <div className="glass px-4 py-2 rounded-xl flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm font-medium">{account.slice(0, 6)}...{account.slice(-4)}</span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              ) : (
                <button onClick={handleConnect} disabled={isLoading} className="btn-primary flex items-center gap-2 text-sm">
                  <Wallet className="w-4 h-4" />
                  {isLoading ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-800/50 bg-dark/95 backdrop-blur-xl">
            <div className="px-4 py-4 space-y-4">
              <nav className="flex flex-col gap-3 text-gray-400">
                <a href="#how-it-works" className="hover:text-white transition-colors py-2">How it works</a>
                <a href="https://docs.iex.ec" className="hover:text-white transition-colors py-2">Documentation</a>
              </nav>
              {connected ? (
                <div className="glass px-4 py-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm">{account.slice(0, 6)}...{account.slice(-4)}</span>
                  </div>
                  <span className="text-sm text-gray-400">{showPrivateData ? plsBalance : '***.**'} PLS</span>
                </div>
              ) : (
                <button onClick={handleConnect} disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2">
                  <Wallet className="w-4 h-4" />
                  {isLoading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 lg:pt-24 pb-8 sm:pb-12">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 glass px-3 py-1.5 rounded-full text-xs sm:text-sm text-gray-400 mb-6">
              <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
              <span>Hack4Privacy Hackathon Project</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight">
              Liquid Staking with
              <span className="block gradient-text">Complete Privacy</span>
            </h1>
            
            <p className="text-base sm:text-lg lg:text-xl text-gray-400 mb-8 sm:mb-10 px-4">
              First protocol where your stake amounts stay hidden on-chain. 
              Powered by iExec Confidential Computing.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-12 px-2">
              <div className="glass px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
                <Lock className="w-4 h-4 text-primary" />
                <span>Hidden Positions</span>
              </div>
              <div className="glass px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
                <Server className="w-4 h-4 text-secondary" />
                <span>TEE Protected</span>
              </div>
              <div className="glass px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 text-xs sm:text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <span>Earn Rewards</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="card group hover:border-primary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-500">Total Value Locked</span>
              <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-primary/60 group-hover:text-primary transition-colors" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">{mockData.totalStaked}</div>
            <div className="text-xs text-gray-600 mt-1">ETH</div>
          </div>

          <div className="card group hover:border-green-500/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-500">Current APY</span>
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-500/60 group-hover:text-green-500 transition-colors" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-500">{mockData.apy}%</div>
            <div className="text-xs text-gray-600 mt-1">Annual yield</div>
          </div>

          <div className="card group hover:border-secondary/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-500">Your Stake</span>
              <button 
                onClick={() => setShowPrivateData(!showPrivateData)}
                className="p-1 hover:bg-white/5 rounded-lg transition-colors"
              >
                {showPrivateData ? 
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" /> : 
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                }
              </button>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {showPrivateData ? mockData.yourStakeRevealed : mockData.yourStake}
            </div>
            <div className="text-xs text-green-500 mt-1 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              Private
            </div>
          </div>

          <div className="card group hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              <span className="text-xs sm:text-sm text-gray-500">Pending Rewards</span>
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500/60 group-hover:text-yellow-500 transition-colors" />
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold">
              {showPrivateData ? mockData.pendingRewardsRevealed : mockData.pendingRewards}
            </div>
            <div className="text-xs text-gray-600 mt-1">PLS tokens</div>
          </div>
        </div>
      </section>

      {/* Staking Interface */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-24">
        <div className="max-w-lg mx-auto">
          <div className="card p-4 sm:p-6 lg:p-8">
            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-dark rounded-xl mb-6 sm:mb-8 overflow-x-auto">
              {['stake', 'unstake', 'rewards', 'history', 'privacy'].map((tab) => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2.5 sm:py-3 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
                    activeTab === tab 
                      ? 'bg-gradient-to-r from-primary to-secondary text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Stake Tab */}
            {activeTab === 'stake' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Amount</label>
                    <span className="text-xs text-gray-600">Balance: {parseFloat(ethBalance).toFixed(4)} ETH</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={stakeAmount}
                      onChange={(e) => setStakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field pr-20 text-lg sm:text-xl"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <button 
                        onClick={() => setStakeAmount(parseFloat(ethBalance).toFixed(4))}
                        className="text-xs text-primary hover:text-primary-dark transition-colors"
                      >
                        MAX
                      </button>
                      <span className="text-gray-500 font-medium">ETH</span>
                    </div>
                  </div>
                </div>

                <div className="glass p-3 sm:p-4 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <FileKey className="w-4 h-4 text-primary" />
                    Privacy Protection
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                    Your stake will be hidden using a cryptographic commitment. 
                    A secret salt will be generated for you to reveal your position later.
                  </p>
                  
                  {teeStatus.active && (
                    <div className="flex items-center gap-2 text-xs text-green-500 pt-2 border-t border-gray-800">
                      <CheckCircle className="w-4 h-4" />
                      <span>TEE Computation Active</span>
                      {teeStatus.taskId && (
                        <span className="text-gray-600">Task: {teeStatus.taskId.slice(0, 8)}...</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                    <span className="text-gray-500">You will receive</span>
                    <span className="font-medium">{stakeAmount || '0'} PLS</span>
                  </div>
                </div>

                <button 
                  onClick={handleStake} 
                  disabled={!connected || !stakeAmount || isLoading}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 sm:py-4 text-base"
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Stake Privately
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>

                {!connected && (
                  <p className="text-center text-xs sm:text-sm text-gray-500">
                    Connect your wallet to stake
                  </p>
                )}
              </div>
            )}

            {/* Unstake Tab */}
            {activeTab === 'unstake' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-400">Amount to Unstake</label>
                    <span className="text-xs text-gray-600">Staked: {showPrivateData ? mockData.yourStakeRevealed : '***.**'} PLS</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      value={unstakeAmount}
                      onChange={(e) => setUnstakeAmount(e.target.value)}
                      placeholder="0.0"
                      className="input-field pr-16 text-lg sm:text-xl"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">PLS</span>
                  </div>
                </div>

                <div>
                  <label className="text-sm text-gray-400 mb-2 block">Your Secret Salt</label>
                  <input
                    type="password"
                    value={salt}
                    onChange={(e) => setSalt(e.target.value)}
                    placeholder="Enter salt to reveal commitment"
                    className="input-field"
                  />
                  <p className="text-xs text-gray-600 mt-2">
                    Required to prove ownership of your stake
                  </p>
                </div>

                <div className="glass p-3 sm:p-4 rounded-xl">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">You will receive</span>
                    <span className="font-medium">{unstakeAmount || '0'} ETH</span>
                  </div>
                </div>

                <button 
                  onClick={handleUnstake}
                  disabled={!connected || !unstakeAmount || !salt || isLoading} 
                  className="btn-primary w-full py-3.5 sm:py-4 text-base"
                >
                  {isLoading ? 'Processing...' : 'Unstake & Reveal'}
                </button>
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Transaction History</h3>
                  <p className="text-sm text-gray-500">Your private staking activity</p>
                </div>
                <TransactionHistory account={account} provider={provider} />
              </div>
            )}

            {/* Privacy Tab */}
            {activeTab === 'privacy' && (
              <PrivacyComparison />
            )}

            {/* Rewards Tab */}
            {activeTab === 'rewards' && (
              <div className="space-y-6">
                <div className="text-center py-6 sm:py-8">
                  <p className="text-sm text-gray-500 mb-2">Claimable Rewards</p>
                  <div className="text-4xl sm:text-5xl font-bold gradient-text mb-1">
                    {showPrivateData ? mockData.pendingRewardsRevealed : mockData.pendingRewards}
                  </div>
                  <p className="text-gray-500">PLS tokens</p>
                </div>

                <div className="glass p-3 sm:p-4 rounded-xl text-center">
                  <p className="text-xs sm:text-sm text-gray-500">
                    Rewards are calculated confidentially inside iExec TEE. 
                    Your individual amount remains private until claimed.
                  </p>
                </div>

                <button disabled={!connected} className="btn-primary w-full py-3.5 sm:py-4 text-base">
                  Claim Rewards
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-20 lg:pb-28">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">How Privacy Works</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">
            Your stake amounts are protected through a combination of cryptographic commitments and confidential computing.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card p-6 sm:p-8 group hover:border-primary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-primary/20 transition-colors">
              <Lock className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <div className="text-xs text-primary font-medium mb-2">Step 1</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Commit & Stake</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Your stake amount is hashed with a secret salt. Only the cryptographic commitment is stored on-chain, not the actual amount.
            </p>
          </div>

          <div className="card p-6 sm:p-8 group hover:border-secondary/30 transition-all duration-300">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-secondary/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-secondary/20 transition-colors">
              <Server className="w-6 h-6 sm:w-7 sm:h-7 text-secondary" />
            </div>
            <div className="text-xs text-secondary font-medium mb-2">Step 2</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">TEE Computation</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              iExec's Trusted Execution Environment processes your data in an encrypted enclave. Even node operators can't see your amounts.
            </p>
          </div>

          <div className="card p-6 sm:p-8 group hover:border-green-500/30 transition-all duration-300 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4 sm:mb-6 group-hover:bg-green-500/20 transition-colors">
              <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-green-500" />
            </div>
            <div className="text-xs text-green-500 font-medium mb-2">Step 3</div>
            <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Private Claims</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Claim rewards using TEE-signed proofs. Your staking position remains completely private throughout the entire process.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-semibold">Private Liquid Staking</span>
            </div>
            
            <p className="text-sm text-gray-600 text-center">
              Built with iExec Confidential Computing
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://iex.ec" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">iExec</a>
              <a href="https://docs.iex.ec" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Docs</a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
