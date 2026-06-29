import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  language: 'en' | 'bg'
}

const initialState: UIState = {
  theme: 'light',
  sidebarOpen: true,
  language: 'en',
}

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen
    },
    setLanguage: (state, action: PayloadAction<'en' | 'bg'>) => {
      state.language = action.payload
    },
  },
})

export const { setTheme, toggleSidebar, setLanguage } = uiSlice.actions
export default uiSlice.reducer
