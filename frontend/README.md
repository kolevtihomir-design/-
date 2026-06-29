# B2B Sourcing OS - Frontend Application

React-based web application for B2B Sourcing OS buyers and administrators.

## Features

- **Authentication** - Login/register with JWT tokens
- **Product Search** - Full-text search with filters and scoring
- **Negotiation Management** - View and manage procurement deals
- **Analytics Dashboard** - KPI tracking and performance metrics
- **Team Collaboration** - Workspace management and sharing
- **Supplier Portal** - For supplier account management

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Routing:** React Router v6
- **State Management:** Redux Toolkit + Redux Persist
- **Styling:** Tailwind CSS
- **Charts:** Recharts
- **HTTP Client:** Axios
- **Build Tool:** Vite
- **Icons:** React Icons

## Project Structure

```
frontend/
├── src/
│  ├── components/      # Reusable UI components
│  ├── pages/          # Page components (routes)
│  ├── redux/          # Redux store, slices, hooks
│  ├── services/       # API client services
│  ├── styles/         # Global styles and Tailwind config
│  ├── utils/          # Helper functions
│  ├── hooks/          # Custom React hooks
│  ├── App.tsx         # Main app component with routing
│  └── main.tsx        # Entry point
├── public/            # Static assets
├── vite.config.ts     # Vite configuration
├── tailwind.config.js # Tailwind CSS config
└── tsconfig.json      # TypeScript config
```

## Setup & Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development Server

```bash
npm run dev
# Server runs at http://localhost:3000
# API proxy: http://localhost:8000
```

### Build for Production

```bash
npm run build
# Output: dist/
```

### Preview Build

```bash
npm run preview
```

## Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/login` | LoginPage | User login |
| `/register` | RegisterPage | User registration |
| `/` | Dashboard | Main dashboard with KPIs |
| `/search` | SearchPage | Product search interface |
| `/product/:id` | ProductDetailPage | Product details |
| `/negotiations` | NegotiationPage | Manage negotiations |
| `/analytics` | AnalyticsPage | Detailed analytics |
| `/profile` | ProfilePage | User profile settings |
| `/team` | TeamPage | Team management |
| `/supplier` | SupplierPortalPage | Supplier account |

## Redux State Structure

```
store:
├── auth
│  ├── user: User | null
│  ├── token: string | null
│  ├── isAuthenticated: boolean
│  ├── loading: boolean
│  └── error: string | null
├── search
│  ├── results: SearchResult[]
│  ├── recentSearches: string[]
│  ├── bookmarkedProducts: number[]
│  ├── loading: boolean
│  └── total: number
├── negotiation
│  ├── activeDeal: Deal | null
│  ├── deals: Deal[]
│  ├── loading: boolean
│  └── error: string | null
└── ui
   ├── theme: 'light' | 'dark'
   ├── sidebarOpen: boolean
   └── language: 'en' | 'bg'
```

## API Integration

The frontend communicates with the backend API at `/api`. Axios interceptors:
- Automatically attach JWT tokens to requests
- Handle 401 (unauthorized) responses with redirect to login
- Retry failed requests with exponential backoff

## Key Components

### Layout
- **Navbar** - Top navigation with user menu
- **Sidebar** - Left navigation with role-based menu items
- **ProtectedRoute** - Route guard for authenticated pages

### Forms
- **LoginForm** - Email/password authentication
- **SearchForm** - Product search with filters
- **NegotiationForm** - Create/manage deals

### Displays
- **Dashboard** - KPI cards + charts (LineChart, BarChart)
- **SearchResults** - Paginated product listings
- **NegotiationList** - Deal history and status

## Styling

Uses Tailwind CSS with custom configuration:
- Responsive grid layouts
- Custom color scheme (blue primary)
- Utility-first approach
- Automatic dark mode support (ready for toggle)

## Customization

### Add New Page
1. Create component in `src/pages/`
2. Add route in `App.tsx`
3. Add menu item in `Sidebar.tsx` (if needed)

### Add Redux Slice
1. Create slice in `src/redux/slices/`
2. Register in `src/redux/store.ts`
3. Use with `useAppDispatch` and `useAppSelector` hooks

### Add API Endpoint
1. Add function in `src/services/api.ts`
2. Create API call in component
3. Dispatch Redux action with response

## Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
```

Accessed via `import.meta.env.VITE_API_URL`

## Performance Optimization

- Code splitting (Redux, Vendor chunks)
- Lazy route loading (with React.lazy)
- Image optimization (WebP format)
- CSS minification (Tailwind purge)
- JS minification (Terser)

## Testing

```bash
npm run test          # Run tests with Vitest
npm run test:ui       # Run with UI
```

## Deployment

### Build
```bash
npm run build
```

### Serve
```bash
npm run preview  # Local preview
```

### Production
- Deploy `dist/` to CDN or static hosting
- Configure API base URL for production
- Enable HTTPS
- Setup monitoring (Sentry recommended)

## Troubleshooting

**CORS errors:**
- Ensure backend is running on `http://localhost:8000`
- Check Vite proxy config in `vite.config.ts`

**API 401 errors:**
- Token might be expired
- Check `localStorage` for `access_token`
- Login again to refresh token

**Tailwind styles not applied:**
- Ensure files are in `content` array of `tailwind.config.js`
- Run `npm install` to ensure Tailwind is installed
- Restart dev server

## Next Steps

- [ ] Add role-based access control
- [ ] Implement product detail view
- [ ] Add 2FA verification flow
- [ ] Implement team collaboration UI
- [ ] Add supplier portal features
- [ ] Setup error boundaries
- [ ] Add loading skeletons
- [ ] Implement pagination
- [ ] Add export/print functionality
- [ ] Setup analytics tracking

## Support

For issues, see backend documentation at `../SECURITY.md` and `../DEPLOYMENT.md`
