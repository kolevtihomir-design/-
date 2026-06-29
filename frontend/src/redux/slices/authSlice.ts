import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface User {
  id: number
  email: string
  role: 'admin' | 'buyer' | 'supplier' | 'viewer'
  first_name: string
  last_name: string
  totp_required?: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  totp_temporary_token?: string
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload
      state.isAuthenticated = true
      localStorage.setItem('access_token', action.payload)
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload
      localStorage.setItem('user', JSON.stringify(action.payload))
    },
    setTOTPTemporaryToken: (state, action: PayloadAction<string>) => {
      state.totp_temporary_token = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
    },
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      state.error = null
      state.totp_temporary_token = undefined
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
    },
    clearError: (state) => {
      state.error = null
    },
  },
})

export const { setLoading, setToken, setUser, setTOTPTemporaryToken, setError, logout, clearError } = authSlice.actions
export default authSlice.reducer
