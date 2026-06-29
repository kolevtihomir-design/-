import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Deal {
  id: number
  product_id: number
  supplier_id: number
  status: string
  initial_price: number
  proposed_price: number
  final_price?: number
  quantity: number
  created_at: string
}

interface NegotiationState {
  activeDeal: Deal | null
  deals: Deal[]
  loading: boolean
  error: string | null
}

const initialState: NegotiationState = {
  activeDeal: null,
  deals: [],
  loading: false,
  error: null,
}

const negotiationSlice = createSlice({
  name: 'negotiation',
  initialState,
  reducers: {
    setActiveDeal: (state, action: PayloadAction<Deal | null>) => {
      state.activeDeal = action.payload
    },
    setDeals: (state, action: PayloadAction<Deal[]>) => {
      state.deals = action.payload
    },
    addDeal: (state, action: PayloadAction<Deal>) => {
      state.deals.push(action.payload)
    },
    updateDeal: (state, action: PayloadAction<Deal>) => {
      const index = state.deals.findIndex(d => d.id === action.payload.id)
      if (index > -1) {
        state.deals[index] = action.payload
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setActiveDeal, setDeals, addDeal, updateDeal, setLoading, setError, clearError } =
  negotiationSlice.actions
export default negotiationSlice.reducer
