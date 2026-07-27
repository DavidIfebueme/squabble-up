#!/usr/bin/env bash
set -euo pipefail

SERVER="root@23.239.29.4"
APP_DIR="/opt/squabble-up"
API_PORT=3100

echo "=== Deploying squabble-up API ==="

# Build shared package locally
echo "[1/5] Building shared package..."
cd "$(dirname "$0")/packages/shared"
pnpm build

# Sync to server
echo "[2/5] Syncing to server..."
rsync -avz --delete \
  --exclude node_modules \
  --exclude .git \
  --exclude dist \
  "$(dirname "$0")/" "$SERVER:$APP_DIR/"

# Rebuild on server
echo "[3/5] Installing dependencies & building..."
ssh "$SERVER" << 'REMOTE'
  cd /opt/squabble-up
  pnpm install --frozen-lockfile 2>/dev/null || pnpm install
  cd packages/shared && pnpm build
  cd ../../apps/api && pnpm build
REMOTE

# Restart API
echo "[4/5] Restarting API..."
ssh "$SERVER" << 'REMOTE'
  cd /opt/squabble-up/apps/api
  pm2 restart squabble-api || pm2 start dist/main.js --name squabble-api --cwd /opt/squabble-up/apps/api
  pm2 save
REMOTE

# Verify
echo "[5/5] Verifying..."
sleep 2
STATUS=$(ssh "$SERVER" "curl -s -o /dev/null -w '%{http_code}' http://localhost:$API_PORT/api/v1/topics")
if [ "$STATUS" = "200" ]; then
  echo "✅ API is healthy (HTTP $STATUS)"
else
  echo "❌ API returned HTTP $STATUS — check PM2 logs"
  exit 1
fi

echo "=== Deploy complete ==="
