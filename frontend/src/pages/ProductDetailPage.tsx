import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { FiStar, FiDollarSign, FiTruck, FiBox, FiCalendar, FiAward } from 'react-icons/fi'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter } from 'recharts'

interface Product {
  id: number
  name: string
  category: string
  supplier: string
  supplier_rating: number
  description: string
  price: number
  landed_cost: number
  moq: number
  lead_time_days: number
  score: number
  trust_score: number
}

interface PriceHistory {
  date: string
  price: number
  source: string
}

export default function ProductDetailPage() {
  const { id } = useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([])
  const [offers, setOffers] = useState<any[]>([])

  useEffect(() => {
    const mockProduct: Product = {
      id: parseInt(id || '0') || 101,
      name: 'Industrial Pump Motorized 5HP',
      category: 'Industrial Equipment',
      supplier: 'TechSupply Inc',
      supplier_rating: 4.8,
      description: 'High-performance motorized pump suitable for industrial applications. Features variable speed control, energy-efficient motor, and stainless steel construction.',
      price: 4800,
      landed_cost: 5240,
      moq: 10,
      lead_time_days: 14,
      score: 0.82,
      trust_score: 0.89
    }
    setProduct(mockProduct)

    const mockPriceHistory: PriceHistory[] = [
      { date: '2024-06-01', price: 5200, source: 'SerpApi' },
      { date: '2024-06-05', price: 5100, source: 'SearXNG' },
      { date: '2024-06-10', price: 5000, source: 'Keepa' },
      { date: '2024-06-15', price: 4900, source: 'SerpApi' },
      { date: '2024-06-20', price: 4800, source: 'Direct' },
      { date: '2024-06-28', price: 4800, source: 'Direct' }
    ]
    setPriceHistory(mockPriceHistory)

    const mockOffers = [
      {
        supplier: 'TechSupply Inc',
        price: 4800,
        moq: 10,
        lead_time: 14,
        rating: 4.8,
        landed_cost: 5240,
        score: 0.82
      },
      {
        supplier: 'IndustrialHub',
        price: 4950,
        moq: 5,
        lead_time: 21,
        rating: 4.5,
        landed_cost: 5310,
        score: 0.78
      },
      {
        supplier: 'GlobalTrade',
        price: 5100,
        moq: 20,
        lead_time: 7,
        rating: 4.2,
        landed_cost: 5380,
        score: 0.75
      }
    ]
    setOffers(mockOffers)
  }, [id])

  if (!product) {
    return <div className="text-center py-12 text-gray-500">Loading product...</div>
  }

  const scorePercentage = (product.score * 100).toFixed(0)
  const trustPercentage = (product.trust_score * 100).toFixed(0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
        <p className="text-gray-600 mt-1">{product.category} • {product.supplier}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Product Overview</h2>

          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <FiDollarSign className="w-5 h-5 text-blue-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Market Price</p>
                <p className="text-2xl font-bold text-gray-900">${product.price.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FiTruck className="w-5 h-5 text-orange-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Landed Cost (Delivered)</p>
                <p className="text-2xl font-bold text-gray-900">${product.landed_cost.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">+{((product.landed_cost - product.price) / product.price * 100).toFixed(1)}% above base price</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FiBox className="w-5 h-5 text-green-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Minimum Order Quantity</p>
                <p className="text-2xl font-bold text-gray-900">{product.moq} units</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <FiCalendar className="w-5 h-5 text-purple-500 mt-1" />
              <div>
                <p className="text-sm text-gray-600">Lead Time</p>
                <p className="text-2xl font-bold text-gray-900">{product.lead_time_days} days</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-3">Description</p>
            <p className="text-gray-700 leading-relaxed">{product.description}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Supplier Information</h2>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Supplier Rating</p>
                <div className="flex items-center gap-1">
                  <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                  <span className="font-bold text-gray-900">{product.supplier_rating.toFixed(1)}</span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: `${(product.supplier_rating / 5) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Overall Score</p>
                <span className="font-bold text-blue-600">{scorePercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${product.score * 100}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Based on price (40%), delivery (25%), MOQ (20%), trust (15%)</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Trust Score</p>
                <span className="font-bold text-green-600">{trustPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${product.trust_score * 100}%` }}
                />
              </div>
            </div>
          </div>

          <button className="w-full mt-6 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            Start Negotiation
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Price History</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={priceHistory}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
          {priceHistory.map((h, idx) => (
            <div key={idx} className="text-center p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">{h.date}</p>
              <p className="text-sm font-bold text-gray-900">${h.price.toLocaleString()}</p>
              <p className="text-xs text-gray-500">{h.source}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Competitive Offers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Supplier</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">MOQ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Lead Time</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Rating</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Landed Cost</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-900">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {offers.map((offer, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-900 font-semibold">{offer.supplier}</td>
                  <td className="px-4 py-3 text-gray-900 font-bold">${offer.price.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-900">{offer.moq} units</td>
                  <td className="px-4 py-3 text-gray-900">{offer.lead_time} days</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-gray-900">{offer.rating}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-semibold">${offer.landed_cost.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${offer.score * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-900 font-semibold">{(offer.score * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
