#!/bin/bash
set -euo pipefail

# Ankify EC2 Server Setup Script
# Run on a fresh Ubuntu 24.04 LTS instance
# Usage: ssh ubuntu@<ip> 'bash -s' < deploy/ec2-setup.sh

echo "=== Updating system ==="
sudo apt update && sudo apt upgrade -y

echo "=== Installing Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

echo "=== Installing Python 3.12 + pip ==="
sudo apt install -y python3 python3-pip python3-venv

echo "=== Installing Poetry ==="
curl -sSL https://install.python-poetry.org | python3 -
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"

echo "=== Installing MySQL 8.0 ==="
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql

echo "=== Creating MySQL database and user ==="
sudo mysql -e "CREATE DATABASE IF NOT EXISTS ankify;"
sudo mysql -e "CREATE USER IF NOT EXISTS 'ankify'@'localhost' IDENTIFIED BY 'CHANGE_ME_PRODUCTION_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON ankify.* TO 'ankify'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

echo "=== Installing Nginx ==="
sudo apt install -y nginx
sudo systemctl enable nginx

echo "=== Installing Certbot ==="
sudo apt install -y certbot python3-certbot-nginx

echo "=== Installing poppler-utils (for pdf2image) ==="
sudo apt install -y poppler-utils

echo "=== Installing PM2 ==="
sudo npm install -g pm2

echo "=== Installing Git ==="
sudo apt install -y git

APP_ROOT="${ANKIFY_ROOT:-/home/ubuntu/Ankify}"

echo "=== Creating app directory ==="
sudo mkdir -p "$APP_ROOT"
sudo chown ubuntu:ubuntu "$APP_ROOT"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps (repo path must match deploy/ecosystem.config.cjs — default $APP_ROOT):"
echo "  1. Clone your repo:  git clone <repo-url> $APP_ROOT"
echo "  2. Copy Nginx config: sudo cp $APP_ROOT/deploy/nginx/api.ankify.io /etc/nginx/sites-available/"
echo "  3. Enable site:       sudo ln -sf /etc/nginx/sites-available/api.ankify.io /etc/nginx/sites-enabled/"
echo "  4. Remove default:    sudo rm -f /etc/nginx/sites-enabled/default"
echo "  5. Test Nginx:        sudo nginx -t && sudo systemctl reload nginx"
echo "  6. Get SSL cert:      sudo certbot --nginx -d api.ankify.io"
echo "  7. Create .env files: cp backend/.env.example backend/.env && cp ai-server/.env.example ai-server/.env"
echo "  8. Edit .env files with production values (see deploy/*.env.production templates)"
echo "  9. Deploy backend:    cd $APP_ROOT/backend && npm ci && npx prisma migrate deploy && npm run build"
echo " 10. Deploy AI server:  cd $APP_ROOT/ai-server && poetry install --no-root"
echo " 11. chmod +x $APP_ROOT/ai-server/start-ai.sh"
echo " 12. Start services:    cd $APP_ROOT && pm2 start deploy/ecosystem.config.cjs"
echo " 13. Save PM2:          pm2 save && pm2 startup"
