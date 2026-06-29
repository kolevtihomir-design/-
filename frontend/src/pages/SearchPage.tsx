import { useState } from 'react'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { searchAPI } from '@/services/api'
import { setResults, addRecentSearch } from '@/redux/slices/searchSlice'
import { FiSearch, FiFilter } from 'react-icons/fi'

export default function SearchPage() {
  const dispatch = useAppDispatch()
  const results = useAppSelector((state) => state.search.results)
  const recentSearches = useAppSelector((state) => state.search.recentSearches)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    min_price: '',
    max_price: '',
    min_rating: '',
  })

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    try {
      dispatch(addRecentSearch(query))
      const response = await searchAPI.search({
        query,
        limit: 50,
        filters: {
          min_price: filters.min_price ? parseFloat(filters.min_price) : undefined,
          max_price: filters.max_price ? parseFloat(filters.max_price) : undefined,
          min_rating: filters.min_rating ? parseFloat(filters.min_rating) : undefined,
        },
      })
      dispatch(setResults({ results: response.data.results, total: response.data.total }))
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Product Search</h1>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, suppliers..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <FiSearch /> Search
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <input
            type="number"
            placeholder="Min Price (EUR)"
            value={filters.min_price}
            onChange={(e) => setFilters({ ...filters, min_price: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Max Price (EUR)"
            value={filters.max_price}
            onChange={(e) => setFilters({ ...filters, max_price: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            type="number"
            placeholder="Min Rating"
            value={filters.min_rating}
            onChange={(e) => setFilters({ ...filters, min_rating: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </form>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-600 mb-2">Recent Searches</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search) => (
              <button
                key={search}
                onClick={() => setQuery(search)}
                className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {results.length > 0 ? (
          <>
            <p className="text-sm text-gray-600">Found {results.length} products</p>
            {results.map((product) => (
              <div key={product.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <h3 className="font-bold text-lg">{product.product_name}</h3>
                    <p className="text-sm text-gray-600">{product.supplier_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Price</p>
                    <p className="font-bold text-lg">€{product.unit_price.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Landed Cost</p>
                    <p className="font-bold">€{product.landed_cost_per_unit.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Score</p>
                    <p className={`font-bold text-lg ${product.score < 0.5 ? 'text-green-600' : 'text-orange-600'}`}>
                      {product.score.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          query && <div className="text-center py-12 text-gray-500">No products found</div>
        )}
      </div>
    </div>
  )
}
