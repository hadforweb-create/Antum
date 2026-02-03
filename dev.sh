#!/bin/bash

# dev.sh - Development Startup Script
# Starts Backend (port 4001) and Expo App (port 8081)
# Usage: ./dev.sh

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Starting Nightout Development Environment...${NC}\n"

# Check for required tools
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed. Please install Node.js.${NC}"
    exit 1
fi

# Kill ports if they conflict (optional, user might want to keep them)
# echo "Checking ports..."
# npx kill-port 4001 8081

# Start Backend in a new tab/window
echo -e "${GREEN}📦 Starting Backend (Port 4001)...${NC}"
cd backend
if [ -f "package.json" ]; then
    # Use osascript to open new terminal on macOS
    osascript -e 'tell application "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'
else
    echo -e "${RED}❌ Backend directory not found!${NC}"
    exit 1
fi
cd ..

# Wait for backend to be ready (health check)
echo -e "${BLUE}⏳ Waiting for backend to be ready...${NC}"
MAX_RETRIES=30
count=0
while [ $count -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:4001/health > /dev/null; then
        echo -e "${GREEN}✅ Backend is live!${NC}"
        break
    fi
    sleep 1
    count=$((count+1))
    echo -n "."
done

if [ $count -eq $MAX_RETRIES ]; then
    echo -e "\n${RED}⚠️  Backend didn't start in time, but continuing with Expo...${NC}"
fi

# Start Expo App
echo -e "\n${BLUE}📱 Starting Expo App...${NC}"
echo -e "${BLUE}   Cleaning cache to prevent simulator issues...${NC}"

# Run expo start with cache clean
npx expo start -c
