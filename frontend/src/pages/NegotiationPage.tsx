import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { setDeals, setActiveDeal, setLoading, setError } from '@/redux/slices/negotiationSlice'
import { negotiationAPI } from '@/services/api'
import { FiTrendingUp, FiDollarSign, FiCalendar, FiCheckCircle, FiClock } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DealStats {
  total_deals: number
  active_deals: number
  completed_deals: number
  total_savings: number
  avg_savings_percent: number
  success_rate: number
}

export default function NegotiationPage() {
  const dispatch = useAppDispatch()
  const { deals, activeDeal, loading } = useAppSelector(state => state.negotiation)
  const [stats, setStats] = useState<DealStats | null>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all')

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        dispatch(setLoading(true))
        const response = await negotiationAPI.createDeal({
          product_id: 0,
          supplier_id: 0,
          initial_price: 0,
          target_price: 0,
          quantity: 0,
          negotiation_steps: 0
        })

        if (response && response.data) {
          const mockDeals = [
            {
              id: 1,
              product_id: 101,
              product_name: 'Industrial Pump',
              supplier_name: 'TechSupply Inc',
              initial_price: 5000,
              current_price: 4200,
              target_price: 3800,
              quantity: 100,
              status: 'in_progress',
              created_at: '2024-06-15',
              updated_at: '2024-06-28',
              rounds: 3,
              success_probability: 0.78
            },
            {
              id: 2,
              product_id: 102,
              product_name: 'Steel Plate',
              supplier_name: 'MetalCorp',
              initial_price: 2500,
              current_price: 2100,
              target_price: 1900,
              quantity: 500,
              status: 'completed',
              created_at: '2024-06-01',
              updated_at: '2024-06-10',
              rounds: 5,
              success_probability: 1.0
            },
            {
              id: 3,
              product_id: 103,
              product_name: 'Electronic Components',
              supplier_name: 'ElectroTrade',
              initial_price: 8000,
              current_price: 7500,
              target_price: 6500,
              quantity: 200,
              status: 'in_progress',
              created_at: '2024-06-20',
              updated_at: '2024-06-27',
              rounds: 2,
              success_probability: 0.65
            }
          ]

          dispatch(setDeals(mockDeals as any))

          const mockStats: DealStats = {
            total_deals: 3,
            active_deals: 2,
            completed_deals: 1,
            total_savings: 2200,
            avg_savings_percent: 12.5,
            success_rate: 78
          }
          setStats(mockStats)

          const mockChartData = [
            { date: '2024-06-15', deals: 1, savings: 500 },
            { date: '2024-06-16', deals: 1, savings: 800 },
            { date: '2024-06-20', deals: 2, savings: 1200 },
            { date: '2024-06-25', deals: 2, savings: 1800 },
            { date: '2024-06-28', deals: 3, savings: 2200 }
          ]
          setChartData(mockChartData)
        }
      } catch (error: any) {
        dispatch(setError(error.message || 'Failed to fetch negotiations'))
      } finally {
        dispatch(setLoading(false))
      }
    }

    fetchDeals()
  }, [dispatch])

  const filteredDeals = deals.filter(deal => {
    if (filter === 'active') return deal.status === 'in_progress'
    if (filter === 'completed') return deal.status === 'completed'
    return true
  })

  const getDealStatusBadge = (status: string) => {
    const statusConfig: Record<string, { bg: string; text: string; icon: any }> = {
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: FiClock },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: FiCheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: FiTrendingUp }
    }
    const config = statusConfig[status] || statusConfig.in_progress
    const Icon = config.icon
    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-4 h-4" />
        {status.replace('_', ' ').toUpperCase()}
      </span>
    )
  }

  const calculateSavings = (deal: any) => deal.initial_price - deal.current_price
  const calculateSavingsPercent = (deal: any) => (calculateSavings(deal) / deal.initial_price * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Negotiations</h1>
        <p className="text-gray-600 mt-1">Manage your procurement deals and negotiations</p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Deals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_deals}</p>
              </div>
              <FiTrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_deals}</p>
              </div>
              <FiClock className="w-8 h-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Savings</p>
                <p className="text-2xl font-bold text-green-600">${stats.total_savings.toLocaleString()}</p>
              </div>
              <FiDollarSign className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Success Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.success_rate}%</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Savings Trend</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="savings" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Active Deals</h2>
          <div className="flex gap-2">
            {(['all', 'active', 'completed'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading deals...</div>
        ) : filteredDeals.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No deals found</div>
        ) : (
          <div className="space-y-4">
            {filteredDeals.map(deal => (
              <div
                key={deal.id}
                onClick={() => dispatch(setActiveDeal(deal as any))}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm text-gray-600">Product</p>
                    <p className="font-semibold text-gray-900">{deal.product_name}</p>
                    <p className="text-xs text-gray-500">{deal.supplier_name}</p>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Price Progress</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-lg font-bold text-gray-900">${deal.current_price.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">from ${deal.initial_price.toLocaleString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600">Savings</p>
                    <p className="text-lg font-bold text-green-600">
                      ${calculateSavings(deal).toLocaleString()} ({calculateSavingsPercent(deal)}%)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      {getDealStatusBadge(deal.status)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {activeDeal && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Deal Details</h2>
            <button
              onClick={() => dispatch(setActiveDeal(null as any))}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Target Price</p>
              <p className="text-2xl font-bold text-gray-900">${activeDeal.target_price.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">
                Distance: ${(activeDeal.current_price - activeDeal.target_price).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Negotiation Rounds</p>
              <p className="text-2xl font-bold text-gray-900">{activeDeal.rounds}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Success Probability</p>
              <p className="text-2xl font-bold text-blue-600">{(activeDeal.success_probability * 100).toFixed(0)}%</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Quantity</p>
              <p className="text-2xl font-bold text-gray-900">{activeDeal.quantity.toLocaleString()} units</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-sm font-semibold text-gray-900">{activeDeal.created_at}</p>
            </div>

            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-semibold text-gray-900">{activeDeal.updated_at}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
