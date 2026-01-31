import { useState, useEffect } from 'react'
import { Zap, Wallet } from 'lucide-react'
import { getSmartAccountAddress, isAAConfigured } from '../lib/accountAbstraction'

export default function GaslessToggle({ signer, enabled, onToggle }) {
  const [smartAccountAddress, setSmartAccountAddress] = useState(null)
  const [loading, setLoading] = useState(false)
  const [aaAvailable, setAaAvailable] = useState(false)

  useEffect(() => {
    setAaAvailable(isAAConfigured())
  }, [])

  useEffect(() => {
    if (enabled && signer && !smartAccountAddress) {
      loadSmartAccount()
    }
  }, [enabled, signer])

  const loadSmartAccount = async () => {
    setLoading(true)
    try {
      const address = await getSmartAccountAddress(signer)
      setSmartAccountAddress(address)
    } catch (error) {
      console.error('Failed to load smart account:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!aaAvailable) {
    return null
  }

  return (
    <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${enabled ? 'bg-purple-500/20' : 'bg-gray-500/20'}`}>
            <Zap className={`w-5 h-5 ${enabled ? 'text-purple-400' : 'text-gray-400'}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Gasless Transactions</h3>
            <p className="text-sm text-gray-400">
              {enabled ? 'Stake without paying gas fees' : 'Pay gas with your wallet'}
            </p>
          </div>
        </div>
        
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? 'bg-purple-500' : 'bg-gray-600'
          }`}
          disabled={loading}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {enabled && smartAccountAddress && (
        <div className="mt-3 pt-3 border-t border-purple-500/20">
          <div className="flex items-center gap-2 text-sm">
            <Wallet className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">Smart Account:</span>
            <code className="text-purple-400 font-mono text-xs">
              {smartAccountAddress.slice(0, 6)}...{smartAccountAddress.slice(-4)}
            </code>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-3 text-sm text-gray-400 flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400"></div>
          Initializing smart account...
        </div>
      )}
    </div>
  )
}
