import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'
import { FiTrendingUp, FiDollarSign, FiPercentage, FiTarget } from 'react-icons/fi'

interface AnalyticsData {
  monthlyData: any[]
  categoryDistribution: any[]
  supplierPerformance: any[]
  priceVsQuality: any[]
  timeSeriesData: any[]
  kpiData: {
    total_spend: number
    avg_savings: number
    categories_searched: number
    suppliers_engaged: number
    avg_negotiation_rounds: number
    success_rate: number
  }
}

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899']

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    const mockAnalytics: AnalyticsData = {
      monthlyData: [
        { month: 'Jan', searches: 120, negotiations: 45, completed: 32 },
        { month: 'Feb', searches: 145, negotiations: 52, completed: 38 },
        { month: 'Mar', searches: 168, negotiations: 61, completed: 45 },
        { month: 'Apr', searches: 190, negotiations: 68, completed: 52 },
        { month: 'May', searches: 215, negotiations: 75, completed: 58 },
        { month: 'Jun', searches: 242, negotiations: 82, completed: 65 }
      ],
      categoryDistribution: [
        { name: 'Industrial Equipment', value: 32, color: '#0ea5e9' },
        { name: 'Raw Materials', value: 28, color: '#f59e0b' },
        { name: 'Components', value: 22, color: '#10b981' },
        { name: 'Machinery', value: 12, color: '#ef4444' },
        { name: 'Other', value: 6, color: '#8b5cf6' }
      ],
      supplierPerformance: [
        { supplier: 'TechSupply Inc', deals: 12, success_rate: 92, avg_savings: 2400 },
        { supplier: 'MetalCorp', deals: 10, success_rate: 88, avg_savings: 1850 },
        { supplier: 'ElectroTrade', deals: 8, success_rate: 85, avg_savings: 1620 },
        { supplier: 'GlobalTrade', deals: 7, success_rate: 79, avg_savings: 1200 },
        { supplier: 'IndustrialHub', deals: 6, success_rate: 83, avg_savings: 1450 }
      ],
      priceVsQuality: [
        { price: 2500, quality: 85, size: 100 },
        { price: 3200, quality: 88, size: 140 },
        { price: 1800, quality: 72, size: 80 },
        { price: 4100, quality: 92, size: 180 },
        { price: 2800, quality: 81, size: 120 },
        { price: 3500, quality: 89, size: 160 },
        { price: 2200, quality: 78, size: 95 },
        { price: 3800, quality: 91, size: 170 }
      ],
      timeSeriesData: [
        { date: '2024-06-01', searches: 45, negotiations: 12, savings: 8500 },
        { date: '2024-06-05', searches: 52, negotiations: 15, savings: 12300 },
        { date: '2024-06-10', searches: 61, negotiations: 18, savings: 16800 },
        { date: '2024-06-15', searches: 68, negotiations: 21, savings: 22100 },
        { date: '2024-06-20', searches: 75, negotiations: 25, savings: 28500 },
        { date: '2024-06-28', searches: 82, negotiations: 28, savings: 35200 }
      ],
      kpiData: {
        total_spend: 125400,
        avg_savings: 1850,
        categories_searched: 47,
        suppliers_engaged: 23,
        avg_negotiation_rounds: 4.2,
        success_rate: 87
      }
    }
    setAnalytics(mockAnalytics)
  }, [dateRange])

  if (!analytics) {
    return <div className="text-center py-12 text-gray-500">Loading analytics...</div>
  }

  const { monthlyData, categoryDistribution, supplierPerformance, priceVsQuality, timeSeriesData, kpiData } = analytics

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">Comprehensive procurement analytics and insights</p>
        </div>
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                dateRange === range
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Spend</p>
              <p className="text-2xl font-bold text-gray-900">${(kpiData.total_spend / 1000).toFixed(0)}K</p>
            </div>
            <FiDollarSign className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Savings</p>
              <p className="text-2xl font-bold text-green-600">${kpiData.avg_savings.toLocaleString()}</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Success Rate</p>
              <p className="text-2xl font-bold text-blue-600">{kpiData.success_rate}%</p>
            </div>
            <FiTarget className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.categories_searched}</p>
            </div>
            <FiPercentage className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.suppliers_engaged}</p>
            </div>
            <FiTarget className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Avg Rounds</p>
              <p className="text-2xl font-bold text-gray-900">{kpiData.avg_negotiation_rounds}</p>
            </div>
            <FiTrendingUp className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Activity Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="searches" stroke="#0ea5e9" strokeWidth={2} />
              <Line type="monotone" dataKey="negotiations" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="completed" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Category Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoryDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {categoryDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Cumulative Savings Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Searches/Negotiations', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Savings ($)', angle: 90, position: 'insideRight' }} />
            <Tooltip formatter={(value) => {
              if (typeof value === 'number' && value > 100) return `$${value.toLocaleString()}`
              return value
            }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="searches" stroke="#0ea5e9" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="negotiations" stroke="#f59e0b" strokeWidth={2} />
            <Line yAxisId="right" type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Price vs Quality Analysis</h2>
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" dataKey="price" label={{ value: 'Price ($)', position: 'insideRight', offset: -10 }} />
            <YAxis type="number" dataKey="quality" label={{ value: 'Quality Score', angle: -90, position: 'insideLeft' }} />
            <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value) => {
              if (typeof value === 'number' && value > 100) return `$${value.toLocaleString()}`
              return value
            }} />
            <Scatter name="Products" data={priceVsQuality} fill="#0ea5e9" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Top Suppliers by Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Deals</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Success Rate</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Avg Savings</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {supplierPerformance.map((supplier, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-900">{supplier.supplier}</td>
                  <td className="px-4 py-3 text-gray-900">{supplier.deals}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${supplier.success_rate}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold">{supplier.success_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-900">${supplier.avg_savings.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
