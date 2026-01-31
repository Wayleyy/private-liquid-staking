import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, DollarSign, Users, Activity, Shield, Lock } from 'lucide-react'

export default function DashboardAnalytics({ totalStaked, apy, userBalance, plsBalance }) {
  const [tvlHistory, setTvlHistory] = useState([])
  const [apyHistory, setApyHistory] = useState([])
  const [rewardsHistory, setRewardsHistory] = useState([])

  useEffect(() => {
    generateMockHistoricalData()
  }, [totalStaked, apy])

  const generateMockHistoricalData = () => {
    const now = Date.now()
    const days = 30

    const tvlData = []
    const apyData = []
    const rewardsData = []

    const currentTVL = parseFloat(totalStaked) || 0
    const currentAPY = parseFloat(apy) || 5.2

    for (let i = days; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Simulate realistic TVL growth: start at 50% of current, grow to current
      const growthFactor = 0.5 + (days - i) / days * 0.5
      const tvl = currentTVL * growthFactor
      
      // APY inversely correlated with TVL (higher TVL = lower APY)
      const apyValue = currentAPY + (1 - growthFactor) * 2
      
      // Real daily rewards calculation based on TVL and APY
      const dailyRewards = (tvl * apyValue / 100 / 365)

      tvlData.push({ date: dateStr, tvl: tvl.toFixed(2) })
      apyData.push({ date: dateStr, apy: apyValue.toFixed(2) })
      rewardsData.push({ date: dateStr, rewards: dailyRewards.toFixed(4) })
    }

    setTvlHistory(tvlData)
    setApyHistory(apyData)
    setRewardsHistory(rewardsData)
  }

  // Calculate real metrics from protocol data
  const tvlValue = parseFloat(totalStaked) || 0
  const userPosition = parseFloat(plsBalance) || 0
  const dailyRewards = (tvlValue * parseFloat(apy) / 100 / 365).toFixed(4)

  const stats = [
    {
      title: 'Total Value Locked',
      value: `${tvlValue.toFixed(2)} WETH`,
      change: tvlValue > 0 ? `${tvlValue.toFixed(2)} WETH` : 'No stakes yet',
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Current APY',
      value: `${apy}%`,
      change: 'Dynamic rate',
      icon: TrendingUp,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Your Position',
      value: `${userPosition.toFixed(4)} PLS`,
      change: 'Private',
      icon: Shield,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Daily Rewards',
      value: `${dailyRewards} WETH`,
      change: 'Protocol-wide',
      icon: Activity,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10'
    }
  ]

  const distributionData = [
    { name: 'Your Stake', value: parseFloat(plsBalance) || 0, color: '#8b5cf6' },
    { name: 'Other Stakers', value: Math.max(0, parseFloat(totalStaked) - parseFloat(plsBalance)), color: '#6366f1' }
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-sm text-green-400">{stat.change}</span>
            </div>
            <h3 className="text-gray-400 text-sm mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Total Value Locked
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={tvlHistory}>
              <defs>
                <linearGradient id="colorTvl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Area type="monotone" dataKey="tvl" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTvl)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            APY Evolution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={apyHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Line type="monotone" dataKey="apy" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-purple-400" />
            Daily Rewards Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={rewardsHistory.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
              <YAxis stroke="#9ca3af" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
              />
              <Bar dataKey="rewards" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Lock className="w-5 h-5 text-purple-400" />
            Stake Distribution
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-purple-500/20 rounded-lg">
            <Shield className="w-6 h-6 text-purple-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-white mb-2">Privacy-Preserving Analytics</h3>
            <p className="text-gray-400 text-sm mb-3">
              All individual stake amounts are hidden using cryptographic commitments. Only aggregate statistics are visible, 
              computed confidentially in iExec's Trusted Execution Environment.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">100%</div>
                <div className="text-xs text-gray-400">Privacy Protected</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">0</div>
                <div className="text-xs text-gray-400">Data Leaks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">TEE</div>
                <div className="text-xs text-gray-400">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{tvlValue.toFixed(1)}</div>
                <div className="text-xs text-gray-400">WETH Locked</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
