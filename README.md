# Nightout - iOS Social Activities App

Production-ready React Native + Expo app with Firebase backend.

## 🎯 SENSIBLE DEFAULTS APPLIED

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **State Management** | Zustand | Lightweight, TypeScript-first, no boilerplate |
| **Navigation** | Expo Router | File-based routing, native feel |
| **Styling** | NativeWind (Tailwind) | Matches Figma export classes |
| **Image Handling** | expo-image | Fast, cached, blur placeholders |
| **Video Player** | expo-av | Native performance, background play |
| **Icons** | lucide-react-native | Matches Figma design |
| **Animations** | react-native-reanimated | 60fps, native driver |
| **Forms** | react-hook-form + zod | Type-safe validation |
| **Date/Time** | date-fns | Lightweight, tree-shakeable |
| **Image Compression** | expo-image-manipulator | Before upload optimization |
| **Video Compression** | ffmpeg-kit-react-native | Reels optimization |
| **Firebase SDK** | @react-native-firebase/* | Native performance |
| **Auth Persistence** | AsyncStorage | Automatic session restore |
| **Blur Effects** | expo-blur | iOS Glass effect |
| **Haptics** | expo-haptics | Tap feedback |
| **Safe Areas** | react-native-safe-area-context | iPhone notch support |

## 📱 SCREENS IMPLEMENTED

1. **Auth** - Login / Signup with email
2. **Home** - Activity feed with image cards
3. **Reels** - TikTok-style vertical video swipe
4. **Activity Detail** - Full info + join/leave
5. **Create Activity** - 3-step flow + image upload
6. **Create Reel** - Video upload for activities
7. **Saved** - Bookmarked activities
8. **Profile** - User info + hosted activities
9. **Settings** - Logout, theme toggle

## 🎨 DESIGN SYSTEM

### Colors (from Figma)
- **Primary**: #FF3B30 (light) / #FF453A (dark)
- **Background**: #F2F2F7 (light) / #000000 (dark)
- **Card**: #FFFFFF (light) / #1C1C1E (dark)
- **Muted**: #3C3C43 (light) / #8E8E93 (dark)

### iOS Glass Effects
- Ultra-thin: 30% opacity + 6px blur
- Regular: 70% opacity + 20px blur
- Thick: 85% opacity + 28px blur
- Ultra-thick: 92% opacity + 40px blur

### Typography (SF Pro)
- H1: 34px / Bold / -0.02em
- H2: 28px / Bold / -0.015em
- H3: 22px / Semibold / -0.01em
- Body: 17px / Regular
- Caption: 13px / Semibold / uppercase

### Spacing
- Standard padding: 16px
- Card radius: 20px
- Button radius: 14px
- Avatar radius: Full (circle)

## 🔥 FIREBASE SETUP

### 1. Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create new project "nightout-app"
3. Enable Analytics (optional)

### 2. Enable Services
- **Authentication** → Email/Password
- **Cloud Firestore** → Start in test mode
- **Storage** → Start in test mode

### 3. Add iOS App
1. Register app: `com.yourname.nightout`
2. Download `GoogleService-Info.plist`
3. Place in `/ios/` folder

### 4. Add Android App
1. Register app: `com.yourname.nightout`
2. Download `google-services.json`
3. Place in `/android/app/` folder

### 5. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Activities
    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.organizerId;
    }
    
    // Participants
    match /activities/{activityId}/participants/{participantId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == participantId;
    }
    
    // Reels
    match /reels/{reelId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Saved Activities
    match /users/{userId}/saved/{activityId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### 6. Storage Security Rules
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Activity images
    match /activities/{activityId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 10 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
    
    // Reel videos
    match /reels/{reelId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && request.resource.size < 100 * 1024 * 1024
        && request.resource.contentType.matches('video/.*');
    }
    
    // User avatars
    match /avatars/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024
        && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 🚀 QUICK START

```bash
# Install dependencies
npm install

# Start development
npx expo start

# Run on iOS Simulator
npx expo run:ios

# Run on Android Emulator
npx expo run:android
```

## 📦 BUILD & DEPLOY

### Development Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure project
eas build:configure

# Build for iOS
eas build --platform ios --profile development

# Build for Android
eas build --platform android --profile development
```

### Production Build
```bash
# iOS App Store
eas build --platform ios --profile production

# Android Play Store
eas build --platform android --profile production
```

### Submit to Stores
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## ✅ APP STORE CHECKLIST

### Required Assets
- [ ] App Icon (1024x1024 PNG, no alpha)
- [ ] Launch Screen configured
- [ ] Screenshots (6.7", 6.5", 5.5" iPhones)
- [ ] App Preview video (optional)

### Info.plist Permissions
- [x] NSCameraUsageDescription
- [x] NSPhotoLibraryUsageDescription
- [x] NSMicrophoneUsageDescription
- [x] NSLocationWhenInUseUsageDescription

### Privacy & Legal
- [ ] Privacy Policy URL
- [ ] Terms of Service URL
- [ ] Data deletion request mechanism
- [ ] GDPR compliance (EU users)

### App Store Connect
- [ ] App name, subtitle, keywords
- [ ] Description (4000 chars max)
- [ ] What's New (version notes)
- [ ] Support URL
- [ ] Marketing URL
- [ ] Age Rating questionnaire
- [ ] App category: Social Networking

### Common Rejection Risks & Solutions
1. **Incomplete metadata** → Fill ALL fields
2. **Broken links** → Test privacy/terms URLs
3. **Placeholder content** → Remove all "Lorem ipsum"
4. **Login required without demo** → Add demo account
5. **Crashes** → Test on real devices
6. **Missing permissions rationale** → Clear usage descriptions
7. **Ads not disclosed** → Update if adding ads later

## 📁 PROJECT STRUCTURE

```
nightout-app/
├── app/                    # Expo Router screens
│   ├── (auth)/            # Auth screens (login, signup)
│   ├── (tabs)/            # Tab navigator screens
│   │   ├── index.tsx      # Home feed
│   │   ├── reels.tsx      # Reels screen
│   │   ├── create.tsx     # Create activity
│   │   ├── saved.tsx      # Saved activities
│   │   └── profile.tsx    # Profile screen
│   ├── activity/[id].tsx  # Activity detail
│   └── _layout.tsx        # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── ActivityCard.tsx
│   ├── ImageCarousel.tsx
│   ├── ReelPlayer.tsx
│   └── ...
├── lib/                  # Utilities & config
│   ├── firebase.ts       # Firebase config
│   ├── store.ts          # Zustand store
│   └── utils.ts          # Helper functions
├── hooks/                # Custom hooks
├── types/                # TypeScript types
├── assets/               # Static assets
├── app.json              # Expo config
├── eas.json              # EAS Build config
└── tailwind.config.js    # NativeWind config
```

## 🔧 ENVIRONMENT VARIABLES

Create `.env` file (do NOT commit):

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

## 📄 LICENSE

MIT License - See LICENSE file
