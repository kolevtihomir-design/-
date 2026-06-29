import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SearchResult {
  id: number
  product_id: number
  product_name: string
  supplier_name: string
  unit_price: number
  currency: string
  moq: number
  delivery_days: number
  supplier_rating: number
  landed_cost_per_unit: number
  score: number
}

interface SearchState {
  results: SearchResult[]
  recentSearches: string[]
  bookmarkedProducts: number[]
  loading: boolean
  total: number
}

const initialState: SearchState = {
  results: [],
  recentSearches: [],
  bookmarkedProducts: [],
  loading: false,
  total: 0,
}

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    setResults: (state, action: PayloadAction<{ results: SearchResult[]; total: number }>) => {
      state.results = action.payload.results
      state.total = action.payload.total
    },
    addRecentSearch: (state, action: PayloadAction<string>) => {
      const search = action.payload
      state.recentSearches = [search, ...state.recentSearches.filter(s => s !== search)].slice(0, 10)
    },
    toggleBookmark: (state, action: PayloadAction<number>) => {
      const productId = action.payload
      const index = state.bookmarkedProducts.indexOf(productId)
      if (index > -1) {
        state.bookmarkedProducts.splice(index, 1)
      } else {
        state.bookmarkedProducts.push(productId)
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
  },
})

export const { setResults, addRecentSearch, toggleBookmark, setLoading } = searchSlice.actions
export default searchSlice.reducer
