import axios, { AxiosInstance, AxiosError } from 'axios'
import { useAppDispatch } from '@/redux/hooks'
import { setToken, logout } from '@/redux/slices/authSlice'

const API_BASE_URL = '/api'

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - add JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface SearchParams {
  query: string
  limit?: number
  offset?: number
  filters?: {
    category_id?: number
    min_price?: number
    max_price?: number
    min_rating?: number
    max_moq?: number
    max_delivery_days?: number
    country?: string
  }
}

export const authAPI = {
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  passwordReset: (email: string) =>
    api.post('/auth/password-reset', { email }),
  setup2FA: () => api.post('/auth/2fa/setup'),
  verify2FA: (totp_token: string) =>
    api.post('/auth/2fa/verify', { totp_token }),
  verifyLogin2FA: (totp_token: string, temporary_token: string) =>
    api.post('/auth/2fa/verify-login', { totp_token, temporary_token }),
}

export const searchAPI = {
  search: (params: SearchParams) =>
    api.post('/search', params),
  getCategories: () =>
    api.get('/search/categories'),
  getSuppliers: (country?: string, minRating?: number) =>
    api.get('/search/suppliers', { params: { country, min_rating: minRating } }),
  getTrending: (limit?: number) =>
    api.get('/search/trending', { params: { limit } }),
  getSimilar: (productId: number, limit?: number) =>
    api.get(`/search/similar/${productId}`, { params: { limit } }),
}

export const landedCostAPI = {
  compute: (data: {
    unit_price: number
    quantity: number
    country?: string
    selling_price_per_unit?: number
  }) => api.post('/landed-cost/compute', data),
  batch: (items: any[]) =>
    api.post('/landed-cost/batch', { items }),
  getHistory: (limit?: number) =>
    api.get('/landed-cost/history', { params: { limit } }),
}

export const negotiationAPI = {
  simulate: (data: {
    product_id: number
    buyer_id: number
    quantity: number
    discount_target_pct?: number
  }) => api.post('/negotiation/simulate', data),
  mlPredict: (data: {
    product_id: number
    supplier_id: number
    quantity: number
    initial_unit_price: number
    moq: number
    delivery_days: number
    trust_score: number
    supplier_rating: number
  }) => api.post('/negotiation/ml-predict', data),
  createDeal: (data: {
    product_id: number
    supplier_id: number
    quantity: number
    initial_unit_price: number
  }) => api.post('/negotiation/create', data),
}

export const discoveryAPI = {
  search: (query: string, useCache?: boolean) =>
    api.post('/discovery/search', { query, use_cache: useCache }),
  getSources: () => api.get('/discovery/sources'),
  searchAmazon: (asin: string) =>
    api.post(`/discovery/amazon/${asin}`),
  getTrending: (limit?: number) =>
    api.get('/discovery/trending', { params: { limit } }),
}

export const billingAPI = {
  createUser: (data: { email: string; first_name: string; last_name: string }) =>
    api.post('/billing/users', data),
  getSubscription: (userId: number) =>
    api.get(`/billing/users/${userId}/subscription`),
  upgradePlan: (userId: number, plan: string) =>
    api.post(`/billing/subscribe/${userId}/${plan}`),
  getUsage: (userId: number) =>
    api.get(`/billing/usage/${userId}`),
}

export const kpiAPI = {
  getUserKPI: (userId: number) =>
    api.get(`/kpi/user/${userId}`),
  getUserTimeseries: (userId: number, days?: number) =>
    api.get(`/kpi/user/${userId}/timeseries`, { params: { days } }),
  getPlatformKPI: () => api.get('/kpi/platform'),
  getPlatformTimeseries: (days?: number) =>
    api.get('/kpi/platform/timeseries', { params: { days } }),
}

export const exportAPI = {
  getNegotiationsCSV: (userId: number) =>
    api.get(`/export/csv`, { params: { user_id: userId }, responseType: 'blob' }),
  getERPJSON: (userId: number, includePending?: boolean) =>
    api.get(`/export/erp`, { params: { user_id: userId, include_pending: includePending } }),
  importERP: (userId: number, data: any) =>
    api.post(`/export/import-erp`, { ...data, user_id: userId }),
}

export const teamAPI = {
  createTeam: (data: { name: string; description?: string; website?: string }) =>
    api.post('/team/create', data),
  getTeam: (teamId: number) =>
    api.get(`/team/${teamId}`),
  getMembers: (teamId: number) =>
    api.get(`/team/${teamId}/members`),
  inviteMember: (teamId: number, email: string, role?: string) =>
    api.post(`/team/${teamId}/invite`, { email, role }),
  shareDeal: (teamId: number, dealId: number, notes?: string) =>
    api.post(`/team/${teamId}/share-deal`, { deal_id: dealId, notes }),
  getSharedDeals: (teamId: number) =>
    api.get(`/team/${teamId}/shared-deals`),
  createAPIKey: (teamId: number, name: string) =>
    api.post(`/team/${teamId}/api-key`, { name }),
  getAPIKeys: (teamId: number) =>
    api.get(`/team/${teamId}/api-keys`),
}

export const supplierAPI = {
  register: (data: {
    company_name: string
    business_type: string
    country: string
    tax_id?: string
    description?: string
    website?: string
  }) => api.post('/supplier/register', data),
  getDashboard: () => api.get('/supplier/dashboard'),
  createProduct: (data: {
    name: string
    category: string
    unit_price: number
    moq?: number
    lead_time_days?: number
    description?: string
    stock_quantity?: number
    specifications?: any
  }) => api.post('/supplier/products', data),
  getProducts: (skip?: number, limit?: number) =>
    api.get('/supplier/products', { params: { skip, limit } }),
  getAnalytics: () => api.get('/supplier/analytics'),
  getPayouts: (limit?: number) =>
    api.get('/supplier/payouts', { params: { limit } }),
  updateProduct: (productId: number, data: any) =>
    api.put(`/supplier/products/${productId}`, data),
}

export default api
