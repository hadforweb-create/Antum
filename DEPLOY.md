# Nightout Deployment Guide

Complete deployment guide for the Nightout application.

---

## Prerequisites

- [ ] **Render Account** - [render.com](https://render.com)
- [ ] **Expo Account** - [expo.dev](https://expo.dev) 
- [ ] **Apple Developer Account** - For App Store distribution
- [ ] **Google Play Console** - For Play Store distribution
- [ ] **Sentry Account** - [sentry.io](https://sentry.io) for error tracking

---

## Environment Variables

### Render Backend (set in Dashboard or render.yaml)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string (auto-set by Render) | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens (auto-generated) | ✅ |
| `NODE_ENV` | `production` | ✅ |
| `AWS_REGION` | S3/R2 bucket region (e.g., `us-east-1` or `auto` for R2) | ✅ |
| `AWS_ENDPOINT` | S3/R2 endpoint (e.g., `https://xyz.r2.cloudflarestorage.com`) | ✅ |
| `AWS_ACCESS_KEY_ID` | S3/R2 access key | ✅ |
| `AWS_SECRET_ACCESS_KEY` | S3/R2 secret key | ✅ |
| `AWS_BUCKET_NAME` | S3/R2 bucket name | ✅ |
| `AWS_PUBLIC_URL` | Public CDN URL for media (e.g., `https://cdn.nightout.app`) | ✅ |
| `RESEND_API_KEY` | Resend API key for transactional emails | ✅ |
| `FROM_EMAIL` | Sender email (e.g., `no-reply@nightout.app`) | ✅ |
| `SENTRY_DSN` | Sentry DSN for backend error tracking | ✅ |
| `APP_URL` | Frontend app URL (e.g., `https://nightout.app`) | ✅ |
| `CORS_ORIGIN` | Allowed CORS origins (e.g., `https://nightout.app`) | ✅ |

### EAS / Mobile App

Update these in `eas.json` under `production.env`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_API_URL": "https://nightout-backend.onrender.com",
        "EXPO_PUBLIC_SENTRY_DSN": "https://your-sentry-dsn@sentry.io/123"
      }
    }
  }
}
```

---

## GO LIVE Checklist

### 1. Backend Deployment (Render)

```bash
# 1. Push latest code to GitHub (triggers auto-deploy if connected)
git push origin main

# 2. Manual deploy via Render Dashboard if needed
# Dashboard → nightout-backend → Manual Deploy → Deploy latest commit
```

**Verify:**
```bash
# Health check
curl https://nightout-backend.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

### 2. Database Migrations

Migrations run automatically via `prisma migrate deploy` in the build command.

**Verify migrations applied:**
```bash
# In Render shell or local with production DATABASE_URL
npx prisma migrate status
```

### 3. Mobile App Build (EAS)

```bash
# Install EAS CLI if not already
npm install -g eas-cli

# Login to Expo
eas login

# Build for iOS (production)
eas build --platform ios --profile production

# Build for Android (production)
eas build --platform android --profile production
```

### 4. App Store Submission

```bash
# Submit iOS build to App Store Connect
eas submit --platform ios --latest

# Submit Android build to Google Play
eas submit --platform android --latest
```

### 5. Post-Deploy Verification

- [ ] **Backend health check** passes
- [ ] **Mobile app** can login/register
- [ ] **Media uploads** work (create reel, update avatar)
- [ ] **Messaging** works (send/receive messages)
- [ ] **Password reset** email sends and works
- [ ] **Sentry** receives errors (trigger a test error in dev build)

```bash
# Verify Sentry backend integration
curl -X POST https://nightout-backend.onrender.com/debug-sentry
# Should trigger a test error visible in Sentry dashboard
```

---

## Rollback Plan

### Backend Rollback (Render)

1. Go to **Render Dashboard → nightout-backend → Events**
2. Click on the **previous successful deploy**
3. Click **Rollback to this deploy**

Or via git:
```bash
# Revert to previous commit
git revert HEAD
git push origin main
```

### Database Rollback

> [!CAUTION]
> Database rollbacks may cause data loss. Test thoroughly in staging first.

```bash
# Rollback last migration (destructive!)
npx prisma migrate resolve --rolled-back <migration_name>
```

For safe rollback, restore from automatic Render database backups:
1. **Render Dashboard → nightout-db → Backups**
2. Select desired backup point
3. Click **Restore**

### Mobile App Rollback

1. **iOS**: In App Store Connect, remove the broken build from review/release
2. **Android**: In Google Play Console, halt the rollout and revert to previous build
3. Build and submit the previous working version:

```bash
# Checkout working version
git checkout <working-tag-or-commit>

# Rebuild
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit
eas submit --platform ios --latest
eas submit --platform android --latest
```

---

## Monitoring

### Health Checks

- **Backend**: `https://nightout-backend.onrender.com/health`
- **Uptime**: Render provides automatic uptime monitoring

### Error Tracking

- **Sentry Dashboard**: [sentry.io](https://sentry.io)
- Backend errors tagged: `service:nightout-backend`
- Mobile errors tagged: `service:nightout-app`

### Logs

- **Render Logs**: Dashboard → nightout-backend → Logs
- Filter by: `error`, `warn`, specific endpoints

---

## Quick Reference

| Action | Command |
|--------|---------|
| Deploy backend | `git push origin main` (auto-deploy) |
| Build iOS | `eas build --platform ios --profile production` |
| Build Android | `eas build --platform android --profile production` |
| Submit iOS | `eas submit --platform ios --latest` |
| Submit Android | `eas submit --platform android --latest` |
| Check migrations | `npx prisma migrate status` |
| Health check | `curl https://nightout-backend.onrender.com/health` |
