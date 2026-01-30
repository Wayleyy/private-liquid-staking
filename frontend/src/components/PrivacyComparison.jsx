import { Shield, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react'

const PrivacyComparison = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold mb-3">Why Privacy Matters</h2>
        <p className="text-gray-500 max-w-2xl mx-auto">
          Traditional staking protocols expose your positions publicly. See the difference.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Traditional Staking */}
        <div className="card border-red-500/20 bg-red-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-semibold text-red-500">Traditional Staking</h3>
          </div>

          <div className="space-y-4">
            <div className="glass p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">User Address</div>
              <div className="font-mono text-sm">0x1234...5678</div>
            </div>

            <div className="glass p-4 rounded-lg border-2 border-red-500/30">
              <div className="text-sm text-gray-500 mb-2">Staked Amount</div>
              <div className="text-2xl font-bold text-red-400">125.5 ETH</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Publicly Visible</span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg border-2 border-red-500/30">
              <div className="text-sm text-gray-500 mb-2">Pending Rewards</div>
              <div className="text-xl font-bold text-red-400">2.45 ETH</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-red-500">
                <AlertTriangle className="w-3 h-3" />
                <span>Publicly Visible</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Whale tracking enabled</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>MEV bots can front-run unstakes</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Portfolio exposed to competitors</span>
              </div>
            </div>
          </div>
        </div>

        {/* Private Staking */}
        <div className="card border-green-500/20 bg-green-500/5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-500" />
            <h3 className="text-lg font-semibold text-green-500">Private Staking</h3>
          </div>

          <div className="space-y-4">
            <div className="glass p-4 rounded-lg">
              <div className="text-sm text-gray-500 mb-2">User Address</div>
              <div className="font-mono text-sm">0x1234...5678</div>
            </div>

            <div className="glass p-4 rounded-lg border-2 border-green-500/30">
              <div className="text-sm text-gray-500 mb-2">Commitment Hash</div>
              <div className="font-mono text-sm text-green-400">0xab3f2c8d...</div>
              <div className="mt-3 text-sm text-gray-500 mb-2">Staked Amount</div>
              <div className="text-2xl font-bold">***.**</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-500">
                <EyeOff className="w-3 h-3" />
                <span>Hidden by Commitment</span>
              </div>
            </div>

            <div className="glass p-4 rounded-lg border-2 border-green-500/30">
              <div className="text-sm text-gray-500 mb-2">Pending Rewards</div>
              <div className="text-xl font-bold">**.**</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-green-500">
                <Shield className="w-3 h-3" />
                <span>Computed in TEE</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Amounts hidden on-chain</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>MEV protection via commitments</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-green-400">
                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Complete financial privacy</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="card bg-primary/5 border-primary/20">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold mb-2">How Privacy Protection Works</h4>
            <div className="text-sm text-gray-400 space-y-2">
              <p>
                <strong className="text-white">1. Cryptographic Commitment:</strong> Your stake amount is hashed with a secret salt. 
                Only the hash is stored on-chain, not the actual amount.
              </p>
              <p>
                <strong className="text-white">2. TEE Computation:</strong> Reward calculations happen inside iExec's Trusted Execution Environment. 
                Even the node operators can't see your amounts.
              </p>
              <p>
                <strong className="text-white">3. Zero-Knowledge Claims:</strong> You can prove you have rewards without revealing how much you staked.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Demo */}
      <div className="card">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-primary" />
          Try to Find the Amount
        </h4>
        
        <div className="space-y-3">
          <div className="glass p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">Commitment Hash (On-Chain)</div>
            <div className="font-mono text-sm text-primary break-all">
              0xab3f2c8d9e1a7b4c5f6d8e9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c
            </div>
          </div>

          <div className="glass p-3 rounded-lg">
            <div className="text-xs text-gray-500 mb-1">User Address (On-Chain)</div>
            <div className="font-mono text-sm">0x1234567890abcdef1234567890abcdef12345678</div>
          </div>

          <div className="glass p-3 rounded-lg border-2 border-red-500/30">
            <div className="text-xs text-gray-500 mb-1">Salt (Private - Only You Know)</div>
            <div className="font-mono text-sm text-gray-600">0x????????????????????????????????</div>
          </div>

          <div className="text-center py-4 border-t border-gray-800">
            <div className="text-sm text-gray-500 mb-2">Without the salt, the amount is:</div>
            <div className="text-2xl font-bold text-red-500">IMPOSSIBLE TO FIND</div>
            <div className="text-xs text-gray-600 mt-2">
              Even with unlimited computing power, the commitment cannot be reversed
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyComparison
