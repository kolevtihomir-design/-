import { useEffect, useState } from 'react'
import { useAppSelector } from '@/redux/hooks'
import { kpiAPI } from '@/services/api'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { FiTrendingUp, FiShoppingCart, FiDollarSign, FiZap } from 'react-icons/fi'

interface KPIData {
  user_id: number
  email: string
  negotiation_stats: {
    total_deals: number
    completed_deals: number
    completion_rate: number
    total_savings_eur: number
  }
  usage_stats: {
    searches: number
    negotiations: number
  }
}

export default function Dashboard() {
  const user = useAppSelector((state) => state.auth.user)
  const [kpi, setKpi] = useState<KPIData | null>(null)
  const [timeseries, setTimeseries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        const kpiRes = await kpiAPI.getUserKPI(user.id)
        setKpi(kpiRes.data)

        const timeseriesRes = await kpiAPI.getUserTimeseries(user.id, 30)
        setTimeseries(timeseriesRes.data.data)
      } catch (error) {
        console.error('Failed to fetch KPI data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return <div className="text-center py-12">Loading...</div>
  }

  if (!kpi) {
    return <div className="text-center py-12">No data available</div>
  }

  const stats = [
    {
      title: 'Total Deals',
      value: kpi.negotiation_stats.total_deals,
      icon: <FiShoppingCart className="w-8 h-8" />,
      color: 'bg-blue-500',
    },
    {
      title: 'Completed Deals',
      value: kpi.negotiation_stats.completed_deals,
      icon: <FiTrendingUp className="w-8 h-8" />,
      color: 'bg-green-500',
    },
    {
      title: 'Total Savings',
      value: `€${kpi.negotiation_stats.total_savings_eur.toFixed(2)}`,
      icon: <FiDollarSign className="w-8 h-8" />,
      color: 'bg-purple-500',
    },
    {
      title: 'Success Rate',
      value: `${kpi.negotiation_stats.completion_rate.toFixed(1)}%`,
      icon: <FiZap className="w-8 h-8" />,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">{stat.title}</p>
                <p className="text-3xl font-bold mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-4 rounded-lg text-white`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Negotiations Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="negotiations" stroke="#3b82f6" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Searches Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="searches" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
