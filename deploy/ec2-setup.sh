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

echo "=== Creating app directory ==="
sudo mkdir -p /opt/ankify
sudo chown ubuntu:ubuntu /opt/ankify

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Clone your repo:  cd /opt/ankify && git clone <repo-url> ."
echo "  2. Copy Nginx config: sudo cp deploy/nginx/api.ankify.io /etc/nginx/sites-available/"
echo "  3. Enable site:       sudo ln -s /etc/nginx/sites-available/api.ankify.io /etc/nginx/sites-enabled/"
echo "  4. Remove default:    sudo rm /etc/nginx/sites-enabled/default"
echo "  5. Test Nginx:        sudo nginx -t && sudo systemctl reload nginx"
echo "  6. Get SSL cert:      sudo certbot --nginx -d api.ankify.io"
echo "  7. Create .env files: cp backend/.env.example backend/.env && cp ai-server/.env.example ai-server/.env"
echo "  8. Edit .env files with production values"
echo "  9. Deploy backend:    cd backend && npm install && npx prisma migrate deploy && npm run build"
echo " 10. Deploy AI server:  cd ai-server && poetry install --no-root"
echo " 11. Start services:    pm2 start deploy/ecosystem.config.cjs"
echo " 12. Save PM2:          pm2 save && pm2 startup"
