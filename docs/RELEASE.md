# Nightout App - Release Checklist

This document provides step-by-step instructions to build and publish the Nightout app.

## Prerequisites

- macOS with Xcode installed
- Node.js 18+ installed
- Apple Developer account (for App Store submission)
- Expo account (free at https://expo.dev)

---

## 1. Install EAS CLI

```bash
# Option A: Global install (recommended)
npm install -g eas-cli

# Option B: If permission issues
sudo npm install -g eas-cli

# Option C: Use npx (no install needed)
npx eas-cli --version

# Option D: Homebrew (macOS)
brew install eas-cli
```

Verify installation:
```bash
eas --version
```

---

## 2. Login to Expo/EAS

```bash
eas login
```

Enter your Expo account credentials. If you don't have an account:
```bash
eas register
```

---

## 3. Configure Project

```bash
# Link project to your Expo account
eas build:configure
```

This creates/updates `eas.json`. The project already has this configured.

### Update app.json

Before building, update these fields in `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-actual-project-id-from-expo-dashboard"
      }
    }
  }
}
```

Get your project ID from https://expo.dev after running `eas build:configure`.

### Update eas.json for App Store

Update the `submit.production.ios` section in `eas.json`:

```json
{
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@email.com",
        "ascAppId": "your-app-id-from-app-store-connect",
        "appleTeamId": "YOUR_TEAM_ID"
      }
    }
  }
}
```

---

## 4. Set Production Environment

### Create/Update .env.production

```bash
# .env.production
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

> ⚠️ **Important**: Replace with your actual production API URL before building.

### Environment Variable in EAS

For production builds, set environment variables in EAS:

```bash
eas secret:create --name EXPO_PUBLIC_API_URL --value "https://your-api-domain.com" --scope project
```

---

## 5. Build Commands

### Development Build (for testing)

```bash
# iOS Simulator
eas build --profile development --platform ios

# iOS Device (internal distribution)
eas build --profile preview --platform ios
```

### Production Build (App Store)

```bash
# iOS Production
eas build --profile production --platform ios

# Android Production
eas build --profile production --platform android
```

### Build Both Platforms

```bash
eas build --profile production --platform all
```

---

## 6. Submit to App Store

### Automatic Submission

```bash
# Submit latest iOS build
eas submit --platform ios

# Submit latest Android build to Play Store
eas submit --platform android
```

### Manual Steps (if auto-submit fails)

1. Download the `.ipa` from the EAS build page
2. Open Xcode → Window → Organizer
3. Drag the `.ipa` to the upload section
4. Or use `xcrun altool --upload-app`

---

## 7. Pre-Release Checklist

Before submitting to stores:

- [ ] Test on real device with production API
- [ ] All placeholder strings replaced (coming soon → real features or removed)
- [ ] App icons and splash screen are correct
- [ ] Privacy policy and terms URLs are configured
- [ ] Screenshots prepared for App Store listing
- [ ] Production API is deployed and accessible
- [ ] Backend rate limiting is enabled
- [ ] Database is migrated on production

---

## 8. Local Development Commands

### Start Development

Terminal 1 (Backend):
```bash
cd backend && npm run dev
```

Terminal 2 (App):
```bash
npm start
# or
npx expo start -c
```

### Run on Simulator

```bash
# iOS
npm run ios

# Android
npm run android
```

---

## 9. Backend Deployment

The backend should be deployed to a hosting service:

### Recommended Providers
- **Railway** (easiest, supports SQLite → PostgreSQL)
- **Render** (free tier available)
- **Fly.io** (good for SQLite)
- **Heroku** (no longer free)

### Environment Variables Needed
```
DATABASE_URL=postgresql://...  # Or file:./dev.db for SQLite
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=3001
```

### Database Migration (Production)
```bash
cd backend
npx prisma migrate deploy
npx prisma db seed  # Optional: demo data
```

---

## 10. Troubleshooting

### "EAS CLI not found"
```bash
npm cache clean --force
npm install -g eas-cli
```

### "Build failed: code signing"
- Ensure Apple Developer account is active
- Run `eas credentials` to manage certificates

### "App crashes on launch"
- Check `EXPO_PUBLIC_API_URL` is set correctly
- Verify backend is accessible from the device
- Check Xcode console for crash logs

### "Network request failed"
- Production builds cannot use `localhost`
- Must use a real domain or IP address
- Ensure HTTPS for production

---

## Quick Reference Commands

```bash
# Login
eas login

# Check current project
eas project:info

# Build production iOS
eas build -p ios --profile production

# Submit to App Store
eas submit -p ios

# View build logs
eas build:list

# Manage credentials
eas credentials

# Update over-the-air (future builds only)
eas update
```

---

## Support

- EAS Documentation: https://docs.expo.dev/build/introduction/
- Expo Forums: https://forums.expo.dev/
- Discord: https://chat.expo.dev/
