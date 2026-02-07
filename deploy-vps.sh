#!/bin/bash
set -e

echo "🚀 Frota2026 - Automated VPS Setup"
echo "=================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="johnatamoreira.com.br"
APP_DIR="/var/www/frota2026"
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 64)

echo -e "${GREEN}Step 1: Update System${NC}"
apt update && apt upgrade -y

echo -e "${GREEN}Step 2: Install Dependencies${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs nginx certbot python3-certbot-nginx git

echo -e "${GREEN}Step 3: Install Docker${NC}"
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

echo -e "${GREEN}Step 4: Install Docker Compose${NC}"
apt install -y docker-compose

echo -e "${GREEN}Step 5: Install PM2${NC}"
npm install -g pm2

echo -e "${GREEN}Step 6: Create Application Directory${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${GREEN}Step 7: Clone Repository (Manual Step)${NC}"
echo -e "${YELLOW}You need to upload your project to this VPS.${NC}"
echo -e "${YELLOW}Options:${NC}"
echo -e "  1. git clone <your-repo-url>"
echo -e "  2. scp -r /path/to/Frota2026 root@159.69.198.77:/var/www/${NC}"
echo ""
read -p "Press Enter after uploading the project..."

echo -e "${GREEN}Step 8: Setup Environment Variables${NC}"
cat > $APP_DIR/apps/api/.env << EOF
DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@localhost:5432/frota2026?schema=public"
JWT_SECRET="${JWT_SECRET}"
STORAGE_ENDPOINT="http://localhost:9000"
STORAGE_BUCKET="frota-uploads"
STORAGE_REGION="us-east-1"
MINIO_ROOT_USER="minioadmin"
MINIO_ROOT_PASSWORD="minioadmin"
PORT=3000
EOF

echo -e "${GREEN}Step 9: Update Docker Compose for Production${NC}"
cat > $APP_DIR/docker-compose.yml << 'DOCKEREOF'
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: frota2026
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"

volumes:
  postgres_data:
  minio_data:
DOCKEREOF

# Inject DB_PASSWORD into docker-compose
sed -i "s/\${DB_PASSWORD}/${DB_PASSWORD}/g" $APP_DIR/docker-compose.yml

echo -e "${GREEN}Step 10: Install Project Dependencies${NC}"
cd $APP_DIR
npm install

echo -e "${GREEN}Step 11: Build Applications${NC}"
npm run build -w api
npm run build -w web

echo -e "${GREEN}Step 12: Start Docker Services${NC}"
docker-compose up -d

echo -e "${GREEN}Step 13: Run Database Migrations${NC}"
cd $APP_DIR/apps/api
npx prisma migrate deploy

echo -e "${GREEN}Step 14: Start API with PM2${NC}"
cd $APP_DIR
pm2 start apps/api/dist/main.js --name frota-api
pm2 save
pm2 startup

echo -e "${GREEN}Step 15: Configure Nginx${NC}"
cat > /etc/nginx/sites-available/frota2026 << 'NGINXEOF'
server {
    listen 80;
    server_name johnatamoreira.com.br www.johnatamoreira.com.br;

    # Frontend
    location / {
        root /var/www/frota2026/apps/web/dist;
        try_files $uri /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket for Real-time Tracking
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/frota2026 /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx

echo -e "${GREEN}Step 16: Setup SSL Certificate${NC}"
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

echo -e "${GREEN}Step 17: Configure Firewall${NC}"
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "=================================="
echo ""
echo -e "🌐 Your application is live at:"
echo -e "   https://$DOMAIN"
echo ""
echo -e "📊 Credentials stored in:"
echo -e "   Database Password: ${DB_PASSWORD}"
echo -e "   JWT Secret: ${JWT_SECRET}"
echo ""
echo -e "⚠️  IMPORTANT: Save these credentials securely!"
echo ""
echo -e "📝 Useful Commands:"
echo -e "   View API logs:     pm2 logs frota-api"
echo -e "   Restart API:       pm2 restart frota-api"
echo -e "   View containers:   docker ps"
echo -e "   Nginx logs:        tail -f /var/log/nginx/error.log"
echo ""
