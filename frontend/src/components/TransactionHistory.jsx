import { useState, useEffect } from 'react'
import { Clock, Lock, CheckCircle, XCircle, ExternalLink } from 'lucide-react'

const TransactionHistory = ({ account, provider }) => {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (account) {
      loadTransactions()
    }
  }, [account])

  const loadTransactions = () => {
    try {
      setLoading(true)
      const stored = localStorage.getItem(`tx_history_${account}`)
      if (stored) {
        const txs = JSON.parse(stored)
        setTransactions(txs.sort((a, b) => b.timestamp - a.timestamp))
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const getStatusIcon = (type) => {
    switch (type) {
      case 'stake':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'unstake':
        return <XCircle className="w-5 h-5 text-orange-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getExplorerUrl = (txHash) => {
    return `https://sepolia.arbiscan.io/tx/${txHash}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <Lock className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-500">No transactions yet</p>
        <p className="text-sm text-gray-600 mt-2">Your private staking history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {transactions.map((tx, index) => (
        <div
          key={index}
          className="glass p-4 rounded-xl hover:border-gray-700/50 transition-all duration-200"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <div className="mt-1">{getStatusIcon(tx.type)}</div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">{tx.type}</span>
                  {tx.teeTaskId && (
                    <span className="text-xs glass px-2 py-0.5 rounded">
                      TEE: {tx.teeTaskId.slice(0, 8)}...
                    </span>
                  )}
                </div>
                
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Lock className="w-3 h-3" />
                    <span className="font-mono text-xs">
                      {tx.commitment.slice(0, 10)}...{tx.commitment.slice(-8)}
                    </span>
                  </div>
                  
                  {tx.amount && (
                    <div className="text-gray-600 text-xs">
                      Amount: <span className="text-gray-500">*** (Private)</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(tx.timestamp)}</span>
                  </div>
                </div>
              </div>
            </div>

            {tx.txHash && (
              <a
                href={getExplorerUrl(tx.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-dark transition-colors"
                title="View on Explorer"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>

          {tx.status === 'pending' && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="flex items-center gap-2 text-xs text-yellow-500">
                <div className="animate-spin w-3 h-3 border border-yellow-500 border-t-transparent rounded-full"></div>
                <span>Transaction pending...</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default TransactionHistory
