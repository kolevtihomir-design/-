# B2B Sourcing OS - Frontend Development Guide

## Architecture Overview

### Directory Structure
```
frontend/
├── src/
│  ├── components/       # Reusable UI components
│  │  ├── ErrorBoundary.tsx  # Error handling wrapper
│  │  ├── Layout.tsx        # Main layout component
│  │  ├── Navbar.tsx        # Top navigation
│  │  ├── Sidebar.tsx       # Left navigation
│  │  └── ProtectedRoute.tsx # Route protection
│  ├── pages/           # Page components (routes)
│  ├── redux/           # State management
│  ├── services/        # API client services
│  ├── styles/          # Global styles
│  ├── utils/           # Helper functions
│  │  ├── validation.ts    # Form validation
│  │  ├── apiErrorHandler.ts # Error handling
│  │  └── ...
│  ├── hooks/           # Custom React hooks
│  │  └── useAsync.ts      # Async state management
│  ├── App.tsx          # Main app component
│  └── main.tsx         # Entry point
├── public/             # Static assets
└── vite.config.ts      # Build configuration
```

## Key Utilities

### Form Validation (`utils/validation.ts`)

Pre-built validation rules for common fields:
```typescript
import { validateForm, validationRules } from '@/utils/validation'

const errors = validateForm(formData, {
  email: validationRules.email,
  password: validationRules.password,
  firstName: validationRules.firstName,
  price: validationRules.price
})

if (!hasErrors(errors)) {
  // Submit form
}
```

### API Error Handling (`utils/apiErrorHandler.ts`)

Parse and handle API errors consistently:
```typescript
import { ApiErrorHandler, getErrorMessage, isAuthError } from '@/utils/apiErrorHandler'

try {
  const response = await apiCall()
} catch (error) {
  const message = getErrorMessage(error)
  
  if (isAuthError(error)) {
    // Redirect to login
  }
}
```

### Async Hook (`hooks/useAsync.ts`)

Manage async operations with loading and error states:
```typescript
import { useAsync } from '@/hooks/useAsync'

function MyComponent() {
  const { data, loading, error, execute } = useAsync(
    async () => await apiCall(),
    true  // execute immediately
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  
  return <div>{data}</div>
}
```

### Error Boundary (`components/ErrorBoundary.tsx`)

Wrap components to catch runtime errors:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary'

<ErrorBoundary>
  <YourComponent />
</ErrorBoundary>
```

## Best Practices

### Form Handling

1. **Always validate** before submission:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault()
  const errors = validateForm(formData, {
    email: validationRules.email,
    // ... other fields
  })
  
  if (hasErrors(errors)) {
    setErrors(errors)
    return
  }
  
  // Submit form
}
```

2. **Display validation errors** to users:
```typescript
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  className={`border ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
/>
{errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
```

### API Calls

1. **Use error handling**:
```typescript
import { getErrorMessage } from '@/utils/apiErrorHandler'

try {
  const data = await apiCall()
} catch (error) {
  const message = getErrorMessage(error)
  toast.error(message)
}
```

2. **Use retry logic for important operations**:
```typescript
import { ApiErrorHandler } from '@/utils/apiErrorHandler'

const data = await ApiErrorHandler.retryWithBackoff(
  () => apiCall(),
  3,    // max retries
  1000  // initial delay (ms)
)
```

### Component Design

1. **Use Error Boundaries** for risky components:
```typescript
<ErrorBoundary>
  <ComplexChart data={data} />
</ErrorBoundary>
```

2. **Use useAsync** for async operations:
```typescript
const { data, loading, error } = useAsync(() => fetchData())
```

3. **Handle loading states**:
```typescript
if (loading) return <LoadingSkeleton />
if (error) return <ErrorMessage error={error} />
return <Content data={data} />
```

## Testing

### Unit Tests
```bash
npm run test
npm run test:ui
```

### End-to-End Tests
```bash
npm run e2e
```

## Performance Optimization

### Code Splitting
Routes are automatically code-split via Vite. Pages load on-demand.

### Bundle Analysis
```bash
npm run build
# Check dist/ size
```

### Tips
- Use React.memo() for expensive components
- Use useCallback() for event handlers
- Use lazy loading for images
- Minimize bundle size with tree-shaking

## Debugging

### Console Logs
Use Redux DevTools for state inspection:
```bash
# Install Redux DevTools extension in browser
# Automatically integrated in development
```

### Network Debugging
Open browser DevTools → Network tab to inspect API calls.

### Error Debugging
ErrorBoundary provides error details in development mode. Check browser console for full stack traces.

## Deployment

### Build
```bash
npm run build
# Output: dist/
```

### Serve Locally
```bash
npm run preview
# http://localhost:4173
```

### Production Deployment
1. Set `VITE_API_URL` environment variable
2. Deploy `dist/` folder to static hosting (CDN, S3, Netlify, etc.)
3. Configure API proxy for backend calls
4. Enable HTTPS
5. Setup monitoring (Sentry recommended)

## Common Issues

### CORS Errors
- Ensure backend is running on `http://localhost:8000`
- Check Vite proxy config in `vite.config.ts`
- Verify backend CORS middleware is enabled

### 401 Unauthorized
- Token might be expired
- Check `localStorage` for `access_token`
- Login again to refresh token
- Check token interceptor in `services/api.ts`

### Tailwind Not Applied
- Ensure files in `content` array of `tailwind.config.js`
- Run `npm install`
- Restart dev server
- Clear browser cache

### Redux State Lost on Refresh
- Redux Persist should save to localStorage
- Check browser storage (DevTools → Application → LocalStorage)
- Verify Redux Persist middleware in `redux/store.ts`

## API Integration

All API calls go through `services/api.ts` with:
- JWT token injection
- Automatic 401 error handling
- Consistent error formatting
- Base URL configuration

To add new endpoints:
```typescript
// In services/api.ts
export const myNewAPI = {
  getSomething: async (id: number) => {
    const response = await axios.get(`/v1/endpoint/${id}`)
    return response.data
  }
}

// In component
const { data, loading, error } = useAsync(() => myNewAPI.getSomething(id))
```

## Environment Variables

Create `.env` file:
```env
VITE_API_URL=http://localhost:8000/api
VITE_LOG_LEVEL=debug
```

Access via:
```typescript
const apiUrl = import.meta.env.VITE_API_URL
```

## Support & Resources

- **Redux Docs**: https://redux.js.org
- **React Router**: https://reactrouter.com
- **Tailwind CSS**: https://tailwindcss.com
- **Recharts**: https://recharts.org
- **Axios**: https://axios-http.com
- **Vite**: https://vitejs.dev
