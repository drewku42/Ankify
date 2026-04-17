#!/bin/bash
set -euo pipefail

# Ankify Deploy Script
# Run on the EC2 instance to pull latest changes and restart services.
# Usage (from anywhere): bash /home/ubuntu/Ankify/deploy/deploy.sh
# Repo root is derived from this script's location (override with ANKIFY_ROOT).

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
export ANKIFY_ROOT="${ANKIFY_ROOT:-$REPO_ROOT}"

cd "$REPO_ROOT"

echo "=== Pulling latest changes ($REPO_ROOT) ==="
git pull origin main

echo "=== Deploying backend ==="
cd "$REPO_ROOT/backend"
# Full install (not --production): prisma CLI is a devDependency but required for migrate.
npm ci
npx prisma migrate deploy
npx prisma generate
npm run build

echo "=== Deploying AI server ==="
cd "$REPO_ROOT/ai-server"
poetry install --no-root

echo "=== Restarting services ==="
cd "$REPO_ROOT"
pm2 restart all --update-env

echo "=== Deploy complete ==="
pm2 status
