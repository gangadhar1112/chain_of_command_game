# Deployment Guide - Raja Rani Mantri

## Overview

This guide covers deploying the Raja Rani Mantri game to various platforms including web hosting and mobile app stores.

## Web Deployment

### Netlify Deployment (Recommended)

#### Automatic Deployment
The project is configured for automatic Netlify deployment:

1. **Connect Repository**:
   - Link your Git repository to Netlify
   - Set build command: `npm run build`
   - Set publish directory: `dist`

2. **Environment Variables**:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://your_project.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

3. **Build Settings**:
   ```toml
   # netlify.toml
   [build]
     command = "npm run build"
     publish = "dist"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

#### Manual Deployment
```bash
# Build the project
npm run build

# Deploy to Netlify CLI
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Vercel Deployment

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Configuration** (`vercel.json`):
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ],
     "env": {
       "VITE_FIREBASE_API_KEY": "@firebase_api_key",
       "VITE_FIREBASE_AUTH_DOMAIN": "@firebase_auth_domain"
     }
   }
   ```

### Firebase Hosting

1. **Install Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase Hosting**:
   ```bash
   firebase init hosting
   ```

3. **Deploy**:
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

4. **Configuration** (`firebase.json`):
   ```json
   {
     "hosting": {
       "public": "dist",
       "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
       "rewrites": [
         {
           "source": "**",
           "destination": "/index.html"
         }
       ]
     }
   }
   ```

## Mobile App Deployment

### Android APK Generation

#### Prerequisites
- Android Studio installed
- Java JDK 11 or higher
- Android SDK (API level 23+)

#### Build Process

1. **Prepare for Android**:
   ```bash
   npm run build
   npx cap add android
   npx cap sync android
   ```

2. **Open in Android Studio**:
   ```bash
   npx cap open android
   ```

3. **Build APK**:
   - In Android Studio: Build → Build Bundle(s)/APK(s) → Build APK(s)
   - Or via command line:
     ```bash
     cd android
     ./gradlew assembleDebug
     ```

4. **Signed APK for Release**:
   ```bash
   # Generate keystore (one-time)
   keytool -genkey -v -keystore raja-rani-release.keystore \
     -alias raja-rani -keyalg RSA -keysize 2048 -validity 10000

   # Build signed APK
   ./gradlew assembleRelease
   ```

#### APK Location
- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

### Google Play Store Deployment

#### Preparation

1. **Create Google Play Console Account**:
   - Visit [Google Play Console](https://play.google.com/console)
   - Pay one-time $25 registration fee

2. **App Bundle Generation**:
   ```bash
   cd android
   ./gradlew bundleRelease
   ```

3. **App Bundle Location**:
   `android/app/build/outputs/bundle/release/app-release.aab`

#### Store Listing Requirements

1. **App Information**:
   - **App Name**: Raja Rani Mantri
   - **Short Description**: Classic Indian strategy game
   - **Full Description**: [See store description below]
   - **Category**: Games > Strategy
   - **Content Rating**: Everyone

2. **Graphics Assets**:
   - **App Icon**: 512x512 PNG
   - **Feature Graphic**: 1024x500 PNG
   - **Screenshots**: At least 2 phone screenshots
   - **Phone Screenshots**: 16:9 or 9:16 aspect ratio

3. **Store Description**:
   ```
   Raja Rani Mantri - Chain of Command

   Experience the classic Indian strategy game in a modern digital format! 
   
   🎯 GAME FEATURES:
   • Multiplayer online gameplay (3-6 players)
   • Real-time synchronization
   • Beautiful royal-themed interface
   • Strategic deduction gameplay
   • Social interaction and competition

   👑 HOW TO PLAY:
   Each player receives a secret role in the royal hierarchy. The King must find the Queen, the Queen must find the Minister, and so on. Make correct guesses to lock your position, or risk swapping roles with wrong guesses!

   🏆 ROLES & HIERARCHY:
   • Raja (King) - 100 points
   • Rani (Queen) - 80 points  
   • Mantri (Minister) - 50 points
   • Sipahi (Soldier) - 25 points
   • Police - 15 points
   • Chor (Thief) - 0 points

   Perfect for family game nights, parties, or casual gaming with friends!
   ```

#### Upload Process

1. **Create App**:
   - Go to Google Play Console
   - Create new app
   - Fill in app details

2. **Upload App Bundle**:
   - Go to Release → Production
   - Upload the `.aab` file
   - Fill in release notes

3. **Store Listing**:
   - Add all required graphics
   - Write app description
   - Set pricing (Free)
   - Select countries

4. **Content Rating**:
   - Complete content rating questionnaire
   - Receive rating certificate

5. **Review & Publish**:
   - Review all sections
   - Submit for review
   - Wait for approval (1-3 days)

### iOS Deployment (Future)

#### Prerequisites
- macOS with Xcode
- Apple Developer Account ($99/year)
- iOS device for testing

#### Process
```bash
# Add iOS platform
npx cap add ios
npx cap sync ios
npx cap open ios
```

## Environment Configuration

### Production Environment Variables

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=production_api_key
VITE_FIREBASE_AUTH_DOMAIN=raja-rani-prod.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://raja-rani-prod.firebaseio.com
VITE_FIREBASE_PROJECT_ID=raja-rani-prod
VITE_FIREBASE_STORAGE_BUCKET=raja-rani-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_ENVIRONMENT=production
```

### Staging Environment

```bash
# Firebase Configuration (Staging)
VITE_FIREBASE_API_KEY=staging_api_key
VITE_FIREBASE_AUTH_DOMAIN=raja-rani-staging.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://raja-rani-staging.firebaseio.com
VITE_FIREBASE_PROJECT_ID=raja-rani-staging
VITE_FIREBASE_STORAGE_BUCKET=raja-rani-staging.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=987654321
VITE_FIREBASE_APP_ID=1:987654321:web:fedcba

# App Configuration
VITE_APP_VERSION=1.0.0-staging
VITE_APP_ENVIRONMENT=staging
```

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build project
      run: npm run build
      env:
        VITE_FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
        VITE_FIREBASE_AUTH_DOMAIN: ${{ secrets.FIREBASE_AUTH_DOMAIN }}
        VITE_FIREBASE_DATABASE_URL: ${{ secrets.FIREBASE_DATABASE_URL }}
        VITE_FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
        VITE_FIREBASE_STORAGE_BUCKET: ${{ secrets.FIREBASE_STORAGE_BUCKET }}
        VITE_FIREBASE_MESSAGING_SENDER_ID: ${{ secrets.FIREBASE_MESSAGING_SENDER_ID }}
        VITE_FIREBASE_APP_ID: ${{ secrets.FIREBASE_APP_ID }}
    
    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

### Android Build Pipeline

```yaml
name: Build Android APK

on:
  push:
    tags: ['v*']

jobs:
  build-android:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '11'
    
    - name: Setup Android SDK
      uses: android-actions/setup-android@v2
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web app
      run: npm run build
    
    - name: Sync Capacitor
      run: npx cap sync android
    
    - name: Build APK
      run: |
        cd android
        ./gradlew assembleRelease
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-release.apk
        path: android/app/build/outputs/apk/release/app-release.apk
```

## Performance Optimization

### Build Optimization

1. **Bundle Analysis**:
   ```bash
   npm install -g webpack-bundle-analyzer
   npm run build
   npx webpack-bundle-analyzer dist/assets/*.js
   ```

2. **Code Splitting**:
   ```typescript
   // Lazy load pages
   const GameRoomPage = lazy(() => import('./pages/GameRoomPage'));
   const CreateGamePage = lazy(() => import('./pages/CreateGamePage'));
   ```

3. **Asset Optimization**:
   ```bash
   # Optimize images
   npm install -g imagemin-cli
   imagemin src/assets/*.png --out-dir=dist/assets
   ```

### CDN Configuration

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/database'],
          ui: ['framer-motion', 'lucide-react']
        }
      }
    }
  }
});
```

## Monitoring & Analytics

### Error Tracking

1. **Sentry Integration**:
   ```bash
   npm install @sentry/react @sentry/tracing
   ```

   ```typescript
   // src/main.tsx
   import * as Sentry from "@sentry/react";
   
   Sentry.init({
     dsn: "YOUR_SENTRY_DSN",
     environment: import.meta.env.VITE_APP_ENVIRONMENT,
   });
   ```

2. **Google Analytics**:
   ```typescript
   // src/utils/analytics.ts
   import { gtag } from 'ga-gtag';
   
   gtag('config', 'GA_MEASUREMENT_ID', {
     page_title: document.title,
     page_location: window.location.href,
   });
   ```

### Performance Monitoring

1. **Web Vitals**:
   ```bash
   npm install web-vitals
   ```

   ```typescript
   import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';
   
   getCLS(console.log);
   getFID(console.log);
   getFCP(console.log);
   getLCP(console.log);
   getTTFB(console.log);
   ```

## Security Considerations

### HTTPS Configuration

1. **SSL Certificate**: Automatically provided by Netlify/Vercel
2. **HSTS Headers**: Configure in hosting platform
3. **CSP Headers**: Add Content Security Policy

### Firebase Security

1. **Security Rules**: Properly configured in Firebase Console
2. **API Key Restrictions**: Restrict API keys to specific domains
3. **Authentication**: Enable only required sign-in methods

## Backup & Recovery

### Database Backup

```bash
# Firebase backup
firebase database:get / --output backup.json

# Restore
firebase database:set / backup.json
```

### Code Backup

1. **Git Repository**: Primary backup
2. **Multiple Remotes**: GitHub + GitLab
3. **Automated Backups**: Daily repository snapshots

## Troubleshooting

### Common Deployment Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify environment variables
   - Clear npm cache: `npm cache clean --force`

2. **Firebase Connection Issues**:
   - Verify Firebase configuration
   - Check API key restrictions
   - Validate security rules

3. **Android Build Issues**:
   - Update Android SDK
   - Check Java version
   - Clean build: `./gradlew clean`

### Debug Commands

```bash
# Check build output
npm run build -- --debug

# Analyze bundle
npm run build && npx vite-bundle-analyzer

# Test production build locally
npm run preview
```

---

This deployment guide provides comprehensive instructions for deploying the Raja Rani Mantri game to various platforms with proper configuration, optimization, and monitoring.