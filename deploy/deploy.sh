#!/bin/bash
set -euo pipefail

# Ankify Deploy Script
# Run on the EC2 instance to pull latest changes and restart services
# Usage: cd /opt/ankify && bash deploy/deploy.sh

echo "=== Pulling latest changes ==="
git pull origin main

echo "=== Deploying backend ==="
cd /home/ubuntu/Ankify/backend
npm install --production
npx prisma migrate deploy
npx prisma generate
npm run build

echo "=== Deploying AI server ==="
cd /home/ubuntu/Ankify/ai-server
poetry install --no-root

echo "=== Restarting services ==="
pm2 restart all

echo "=== Deploy complete ==="
pm2 status
