# B2B Sourcing OS - Mobile Application

## Architecture Overview

**Technology Stack:**
- Framework: React Native (cross-platform iOS/Android)
- State Management: Redux Toolkit + Redux Persist
- API: Axios with interceptors for JWT tokens
- Storage: SQLite (offline mode) + AsyncStorage
- Authentication: JWT + Biometric (fingerprint/Face ID)
- Build: Expo for rapid development, EAS for production builds

## Directory Structure

```
mobile/
├── web/              # Next.js/React web app (Expo Web)
├── ios/              # iOS-specific configs
├── android/          # Android-specific configs
├── shared/
│  ├── components/    # Shared UI components
│  ├── screens/       # Screen containers
│  ├── redux/         # State management
│  ├── services/      # API services
│  ├── styles/        # Theme, colors, typography
│  ├── hooks/         # Custom React hooks
│  ├── utils/         # Utility functions
│  └── db/            # SQLite database
├── app.json          # Expo configuration
├── eas.json          # EAS Build configuration
└── package.json      # Dependencies
```

## Features (MVP)

### Authentication
- Email/password login with 2FA support
- Biometric unlock (fingerprint/Face ID)
- Session persistence via Redux Persist
- Token refresh with exponential backoff

### Product Search
- Full-text search with filters
- Recent searches persistence
- Product bookmarks/favorites
- Sort by price, rating, delivery

### Negotiation
- View pending negotiations
- Counter-offer workflow
- Deal history with margins
- Push notifications for updates

### Analytics
- Personal KPI dashboard
- Margin savings summary
- Recent activity timeline
- Charts and visualizations (Chart.js/Victory)

### Offline Mode
- SQLite for local caching
- Syncs when online
- Conflict resolution strategy
- Badge notifications on changes

### Settings
- Profile management
- Notification preferences
- App preferences (theme, language)
- Logout and account deletion

## Key Components

### Redux Store Structure
```
store/
├── slices/
│  ├── auth.ts        # User auth state
│  ├── search.ts      # Search results cache
│  ├── negotiations.ts # Deal management
│  ├── products.ts    # Bookmarks and history
│  └── ui.ts          # UI state (theme, modals)
└── middleware/
   └── api.ts         # API call tracking
```

### API Service (Redux Thunk)
```
services/api.ts
├── setAuthToken()         # JWT header
├── login()                # Email + password
├── searchProducts()       # Full-text search
├── getNegotiations()      # Get deals
├── createCounter()        # Counter-offer
├── getAnalytics()        # User KPIs
└── withRetry()           # Auto-retry logic
```

### Biometric Authentication
```
services/biometric.ts
├── isBiometricAvailable() # Check device support
├── enrollBiometric()      # Register fingerprint
├── verifyBiometric()      # Authenticate
├── disableBiometric()     # Remove
```

### SQLite Database Schema
```
users              # Cached user profile
search_history     # Recent searches
bookmarked_products # Favorites
negotiations       # Deal cache
analytics_cache    # KPI snapshots
```

## Development Workflow

### Setup
```bash
npm install
npx expo prebuild    # Generate native folders
```

### Run
```bash
npx expo start      # Start Expo dev server
# Scan QR code with Expo Go app
```

### Build for Production
```bash
# iOS
eas build --platform ios

# Android
eas build --platform android
```

## Security Considerations

1. **Token Storage**
   - JWT access token: AsyncStorage (RAM-backed)
   - Refresh token: Secure storage (Keychain/Keystore)
   - Clear on logout

2. **Biometric Authentication**
   - Only for device unlock
   - Fallback to password always available
   - Device-specific enrollment

3. **API Calls**
   - HTTPS only (Expo enforces)
   - Certificate pinning for production
   - Request signing with API keys for B2B endpoints

4. **Data Encryption**
   - SQLite encrypted with SQLCipher
   - AsyncStorage uses device encryption
   - Sensitive data cleared on logout

## Offline Capabilities

1. **Sync Strategy**
   - Download latest products on startup
   - Cache search results locally
   - Queue negotiation counter-offers
   - Background sync when online

2. **Conflict Resolution**
   - Server wins for deals
   - Client wins for settings
   - Manual merge for conflicts

## Push Notifications

1. **Triggers**
   - Negotiation accepted/rejected
   - Price drop alert (if configured)
   - Team share notification
   - Payment status

2. **Implementation**
   - Expo Notifications API
   - Firebase Cloud Messaging (FCM)
   - Apple Push Notification service (APN)

## Performance Optimization

1. **Image Optimization**
   - Lazy loading
   - Network image caching
   - Thumbnail generation

2. **List Rendering**
   - FlatList with virtualization
   - Pagination for large datasets
   - Memoization of components

3. **Bundle Size**
   - Code splitting by route
   - Tree-shaking unused code
   - Minification for release builds

## Testing

1. **Unit Tests** (Jest)
   ```bash
   npm run test
   ```

2. **Integration Tests** (Detox)
   ```bash
   npm run test:e2e
   ```

3. **API Mocking** (MSW)
   - Mock service worker for offline testing

## App Store Deployment

### iOS App Store
- Xcode build settings
- Provisioning profiles
- Privacy policy + EULA
- Screenshots and metadata

### Google Play
- Build signing keys
- Google Play Console setup
- Pre-launch report verification
- Screenshots and descriptions

## Roadmap

**Phase 1 (MVP):**
- Authentication + Biometric
- Product search
- Negotiation workflow
- Basic analytics

**Phase 2:**
- Offline sync
- Push notifications
- Team collaboration
- Advanced filters

**Phase 3:**
- AR product visualization
- Voice-based search
- AI recommendations
- App extensions

## Support

For issues, contact: dev@b2bsourcing.local
