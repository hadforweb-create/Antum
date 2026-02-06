#!/usr/bin/env bash
set -e

APP_DIR="$HOME/Desktop/NightOut/nightout-app"
BACKEND_DIR="$APP_DIR/backend"

echo "==> 0) Kill old dev processes (expo/metro/node)"
pkill -f "expo start" 2>/dev/null || true
pkill -f "metro" 2>/dev/null || true
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true
pkill -f "node.*src/index" 2>/dev/null || true

echo "==> 1) Ensure app .env points to backend"
cd "$APP_DIR"
printf "EXPO_PUBLIC_API_URL=http://localhost:3001/api\n" > .env
echo "Wrote .env:"
cat .env

echo "==> 2) Install backend deps + prisma"
cd "$BACKEND_DIR"
npm install
npx prisma generate
npx prisma migrate deploy

echo "==> 3) Start backend (port 3001) in background"
PORT=3001 npm run dev > "$APP_DIR/backend.dev.log" 2>&1 &
BACK_PID=$!
echo "Backend PID: $BACK_PID"
echo "Backend logs: $APP_DIR/backend.dev.log"

echo "==> 4) Wait for backend health"
for i in {1..30}; do
  if curl -s "http://localhost:3001/health" >/dev/null 2>&1 || curl -s "http://localhost:3001/api/health" >/dev/null 2>&1; then
    echo "Backend is up ✅"
    break
  fi
  sleep 1
done

echo "==> 5) Start Expo (cache cleared)"
cd "$APP_DIR"
npx expo start -c
