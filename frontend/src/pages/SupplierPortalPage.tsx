import { useState } from 'react'
import { FiPackage, FiDollarSign, FiTrendingUp, FiStar, FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface SupplierProduct {
  id: number
  name: string
  sku: string
  category: string
  price: number
  stock: number
  rating: number
  orders: number
  revenue: number
}

interface SupplierStats {
  total_revenue: number
  active_products: number
  completed_orders: number
  avg_rating: number
  response_time: number
  fulfillment_rate: number
}

export default function SupplierPortalPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'products' | 'orders' | 'analytics'>('dashboard')
  const [products, setProducts] = useState<SupplierProduct[]>([
    { id: 1, name: 'Industrial Pump 5HP', sku: 'PUMP-001', category: 'Pumps', price: 4800, stock: 50, rating: 4.8, orders: 45, revenue: 216000 },
    { id: 2, name: 'Steel Plate A36', sku: 'STEEL-001', category: 'Materials', price: 450, stock: 200, rating: 4.6, orders: 120, revenue: 54000 },
    { id: 3, name: 'Bearing Ball SKF', sku: 'BEAR-001', category: 'Components', price: 85, stock: 500, rating: 4.9, orders: 340, revenue: 28900 }
  ])
  const [showNewProductForm, setShowNewProductForm] = useState(false)
  const [chartData, setChartData] = useState([
    { month: 'Jan', revenue: 12000, orders: 15 },
    { month: 'Feb', revenue: 15000, orders: 18 },
    { month: 'Mar', revenue: 18000, orders: 22 },
    { month: 'Apr', revenue: 21000, orders: 26 },
    { month: 'May', revenue: 25000, orders: 31 },
    { month: 'Jun', revenue: 28900, orders: 45 }
  ])

  const stats: SupplierStats = {
    total_revenue: 298900,
    active_products: 3,
    completed_orders: 157,
    avg_rating: 4.77,
    response_time: 4,
    fulfillment_rate: 98
  }

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Supplier Portal</h1>
        <p className="text-gray-600 mt-1">Manage your supplier account, products, and analytics</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {(['dashboard', 'products', 'orders', 'analytics'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${(stats.total_revenue / 1000).toFixed(1)}K</p>
                </div>
                <FiDollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.active_products}</p>
                </div>
                <FiPackage className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completed_orders}</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Avg Rating</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.avg_rating.toFixed(2)}</p>
                </div>
                <FiStar className="w-8 h-8 text-yellow-500 fill-current" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Response Time</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.response_time}h</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Fulfillment</p>
                  <p className="text-2xl font-bold text-green-600">{stats.fulfillment_rate}%</p>
                </div>
                <FiTrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue & Orders</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" label={{ value: 'Revenue ($)', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Orders', angle: 90, position: 'insideRight' }} />
                <Tooltip formatter={(value) => {
                  if (typeof value === 'number' && value > 100) return `$${value.toLocaleString()}`
                  return value
                }} />
                <Bar yAxisId="left" dataKey="revenue" fill="#0ea5e9" />
                <Bar yAxisId="right" dataKey="orders" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Product Catalog</h2>
            <button
              onClick={() => setShowNewProductForm(!showNewProductForm)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
            >
              <FiPlus className="w-4 h-4" />
              Add Product
            </button>
          </div>

          {showNewProductForm && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">New Product</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Product Name" className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="SKU" className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="text" placeholder="Category" className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="number" placeholder="Price" className="px-4 py-2 border border-gray-300 rounded-lg" />
                <input type="number" placeholder="Stock" className="px-4 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="flex gap-2">
                <button className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors">
                  Create Product
                </button>
                <button
                  onClick={() => setShowNewProductForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">SKU</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Category</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Price</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Stock</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Rating</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Orders</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-900">Revenue</th>
                  <th className="px-4 py-3 text-center font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {products.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-gray-900">{product.name}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{product.sku}</td>
                    <td className="px-4 py-3 text-gray-600">{product.category}</td>
                    <td className="px-4 py-3 font-bold text-gray-900">${product.price.toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{product.stock} units</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="text-gray-900">{product.rating}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-900">{product.orders}</td>
                    <td className="px-4 py-3 font-bold text-green-600">${product.revenue.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Recent Orders</h2>
          <div className="space-y-4">
            {[
              { id: 'ORD-001', buyer: 'Acme Corp', product: 'Industrial Pump 5HP', qty: 10, total: 48000, status: 'delivered', date: '2024-06-25' },
              { id: 'ORD-002', buyer: 'MegaTrade', product: 'Steel Plate A36', qty: 50, total: 22500, status: 'processing', date: '2024-06-27' },
              { id: 'ORD-003', buyer: 'TechHub', product: 'Bearing Ball SKF', qty: 100, total: 8500, status: 'shipped', date: '2024-06-28' },
              { id: 'ORD-004', buyer: 'GlobalBuy', product: 'Industrial Pump 5HP', qty: 5, total: 24000, status: 'confirmed', date: '2024-06-28' }
            ].map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.buyer}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{order.product}</p>
                      <p className="text-xs text-gray-500">{order.qty} units</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">${order.total.toLocaleString()}</p>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    order.status === 'delivered'
                      ? 'bg-green-100 text-green-700'
                      : order.status === 'shipped'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Sales Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => {
                  if (typeof value === 'number' && value > 100) return `$${value.toLocaleString()}`
                  return value
                }} />
                <Line type="monotone" dataKey="revenue" stroke="#0ea5e9" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products by Revenue</h3>
              <div className="space-y-3">
                {products.sort((a, b) => b.revenue - a.revenue).map(product => (
                  <div key={product.id} className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{product.name}</p>
                    <p className="font-bold text-gray-900">${product.revenue.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top Products by Orders</h3>
              <div className="space-y-3">
                {products.sort((a, b) => b.orders - a.orders).map(product => (
                  <div key={product.id} className="flex items-center justify-between">
                    <p className="text-sm text-gray-900">{product.name}</p>
                    <p className="font-bold text-gray-900">{product.orders} orders</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
