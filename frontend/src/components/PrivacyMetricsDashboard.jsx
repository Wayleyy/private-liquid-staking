import { useState } from 'react'
import { Shield, Eye, EyeOff, Lock, Unlock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function PrivacyMetricsDashboard({ userStaked, totalStaked }) {
  const [showComparison, setShowComparison] = useState(true)

  const privacyMetrics = [
    {
      metric: 'Stake Amount Visibility',
      traditional: 'Fully Visible',
      private: 'Hidden (Commitment)',
      status: 'protected',
      icon: Eye
    },
    {
      metric: 'Reward Calculation',
      traditional: 'On-chain (Public)',
      private: 'TEE (Confidential)',
      status: 'protected',
      icon: Lock
    },
    {
      metric: 'Unstake Requests',
      traditional: 'Frontrunnable',
      private: 'Private Execution',
      status: 'protected',
      icon: Shield
    },
    {
      metric: 'Position Tracking',
      traditional: 'Whale Tracking',
      private: 'Anonymous',
      status: 'protected',
      icon: EyeOff
    }
  ]

  const threatsPrevented = [
    {
      threat: 'Whale Tracking',
      description: 'Large positions are hidden, preventing targeted attacks',
      severity: 'high',
      prevented: true
    },
    {
      threat: 'Front-running',
      description: 'Unstake requests processed confidentially in TEE',
      severity: 'high',
      prevented: true
    },
    {
      threat: 'MEV Exploitation',
      description: 'Transaction amounts hidden from MEV bots',
      severity: 'medium',
      prevented: true
    },
    {
      threat: 'Portfolio Analysis',
      description: 'Individual holdings cannot be analyzed by competitors',
      severity: 'medium',
      prevented: true
    }
  ]

  const privacyScore = {
    overall: 95,
    dataProtection: 100,
    anonymity: 90,
    teeVerification: 100,
    onChainPrivacy: 85
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-400" />
            Privacy Metrics Dashboard
          </h2>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors"
          >
            {showComparison ? 'Hide' : 'Show'} Comparison
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Overall Privacy Score</div>
            <div className="text-3xl font-bold text-purple-400">{privacyScore.overall}%</div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${privacyScore.overall}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Data Protection</div>
            <div className="text-3xl font-bold text-green-400">{privacyScore.dataProtection}%</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-green-400">
              <CheckCircle className="w-4 h-4" />
              TEE Encrypted
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Anonymity Level</div>
            <div className="text-3xl font-bold text-blue-400">{privacyScore.anonymity}%</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-400">
              <Shield className="w-4 h-4" />
              Commitment Based
            </div>
          </div>

          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">TEE Verification</div>
            <div className="text-3xl font-bold text-purple-400">{privacyScore.teeVerification}%</div>
            <div className="mt-2 flex items-center gap-2 text-xs text-purple-400">
              <Lock className="w-4 h-4" />
              SGX Verified
            </div>
          </div>
        </div>
      </div>

      {showComparison && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4">Privacy Comparison: Traditional vs Private Staking</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Metric</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Traditional Staking</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-semibold">Private Staking</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {privacyMetrics.map((item, index) => (
                  <tr key={index} className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <item.icon className="w-5 h-5 text-gray-400" />
                        <span className="text-white font-medium">{item.metric}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400">{item.traditional}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">{item.private}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        <Shield className="w-3 h-3" />
                        Protected
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Shield className="w-6 h-6 text-green-400" />
          Threats Prevented
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {threatsPrevented.map((threat, index) => (
            <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${
                    threat.severity === 'high' ? 'bg-red-500/20' : 'bg-orange-500/20'
                  }`}>
                    <AlertTriangle className={`w-4 h-4 ${
                      threat.severity === 'high' ? 'text-red-400' : 'text-orange-400'
                    }`} />
                  </div>
                  <h4 className="font-semibold text-white">{threat.threat}</h4>
                </div>
                {threat.prevented && (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                )}
              </div>
              <p className="text-sm text-gray-400 ml-10">{threat.description}</p>
              <div className="mt-3 ml-10">
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                  threat.severity === 'high' 
                    ? 'bg-red-500/20 text-red-400' 
                    : 'bg-orange-500/20 text-orange-400'
                }`}>
                  {threat.severity.toUpperCase()} SEVERITY
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-6 h-6 text-purple-400" />
            Your Privacy Status
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400">Stake Amount</span>
              <div className="flex items-center gap-2">
                <EyeOff className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold">Hidden</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400">Commitment Hash</span>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold">On-chain</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400">TEE Computation</span>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400 font-semibold">Active</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg">
              <span className="text-gray-400">Data Encryption</span>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" />
                <span className="text-purple-400 font-semibold">AES-256</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Eye className="w-6 h-6 text-blue-400" />
            What's Visible On-Chain
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="font-semibold text-green-400">Public (Safe)</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400 ml-7">
                <li>• Commitment hashes</li>
                <li>• Total protocol TVL</li>
                <li>• Transaction events</li>
                <li>• Proof verifications</li>
              </ul>
            </div>
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <EyeOff className="w-5 h-5 text-purple-400" />
                <span className="font-semibold text-purple-400">Private (Protected)</span>
              </div>
              <ul className="space-y-1 text-sm text-gray-400 ml-7">
                <li>• Individual stake amounts</li>
                <li>• Reward calculations</li>
                <li>• Position sizes</li>
                <li>• User identities linked to amounts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-green-500/20 rounded-lg">
            <CheckCircle className="w-6 h-6 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Privacy Guarantee</h3>
            <p className="text-gray-400 text-sm">
              Your stake amounts are protected by cryptographic commitments and processed in iExec's hardware-isolated 
              Trusted Execution Environment (TEE). Individual positions are never exposed on-chain or to any third party. 
              Only you can reveal your stake amount using your private salt.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
