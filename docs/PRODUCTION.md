# Production & Go-Live Checklist

## 1. Backend Deployment (Render.com)

1.  **Create Database (Postgres)**
    - Create a new PostgreSQL database on Render (or Neon/Supabase).
    - Get the `External Connection URL`.

2.  **Deploy Backend Service**
    - Connect your GitHub repo to Render.
    - **Build Command:** `cd backend && npm install && npx prisma generate && npm run build`
    - **Start Command:** `cd backend && npm start`
    - **Environment Variables:**
        - `DATABASE_URL`: Your Postgres connection string.
        - `JWT_SECRET`: A long random string.
        - `NODE_ENV`: `production`
        - `AWS_ACCESS_KEY_ID`: Cloudflare R2 / AWS S3 ID.
        - `AWS_SECRET_ACCESS_KEY`: Cloudflare R2 / AWS S3 Secret.
        - `AWS_BUCKET_NAME`: Name of your bucket.
        - `AWS_REGION`: `auto` (for R2) or `us-east-1` (for AWS).
        - `AWS_ENDPOINT`: (R2 only) `https://<accountid>.r2.cloudflarestorage.com`.
        - `RESEND_API_KEY`: Your Resend API key for emails.
        - `SENTRY_DSN`: Your Sentry DSN for Backend (optional).
        - `CORS_ORIGIN`: Your website/app domain (e.g., `https://api.antum.app`).

3.  **Run Migrations**
    - In Render Shell (or locally pointing to prod DB):
      ```bash
      cd backend
      npx prisma migrate deploy
      ```

## 2. Media Storage Setup (Cloudflare R2 Example)

1.  Create a bucket in Cloudflare R2.
2.  Enable "Public Access" or connect a custom domain (e.g. `media.antum.app`).
3.  Set `AWS_PUBLIC_URL` in Backend Env to `https://media.antum.app` (or the managed R2.dev URL).
4.  Create API Tokens with "Edit" permissions (Read/Write).

## 3. Frontend App (Expo/EAS)

1.  **Install Dependencies**
    ```bash
    npm install @sentry/react-native expo-application expo-constants expo-device eas-cli
    ```

2.  **Environment Variables (.env.production)**
    - `EXPO_PUBLIC_API_URL`: Your Render Backend URL (e.g. `https://antum-backend.onrender.com`).
    - `EXPO_PUBLIC_SENTRY_DSN`: Your Sentry DSN for React Native.

3.  **App Configuration (app.json)**
    - Update `ios.bundleIdentifier` (e.g. `com.yourname.antum`).
    - Update `android.package` (e.g. `com.yourname.antum`).

4.  **Build & Submit**
    ```bash
    eas build --profile production --platform ios
    eas submit -p ios
    ```

## 4. Verification

- [ ] **Sign Up:** Create a new account in the production app.
- [ ] **Email:** Test "Forgot Password" to ensure Resend works.
- [ ] **Uploads:** Create a Reel. Verify the video plays (checks S3/R2 CORS and Signed URLs).
- [ ] **Safety:** Block a user and ensure they disappear/cannot message.
- [ ] **Crash:** Force a crash (optional, dev only) to verify Sentry receives it.

## 5. Security Sanity Check

- Ensure `DATABASE_URL` is NOT in `app.json` or client bundles.
- Ensure `AWS_SECRET_ACCESS_KEY` is ONLY on the backend.
- Verify `CORS_ORIGIN` is set to block unauthorized websites from hitting your API.
