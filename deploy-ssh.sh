#!/bin/bash
set -e

echo "🚀 Frota2026 - Deploy Direto via SSH"
echo "===================================="
echo ""

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configurações
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-$(openssl rand -base64 32 | tr -d '\n')}"
JWT_SECRET="${JWT_SECRET:-$(openssl rand -base64 64 | tr -d '\n')}"
MINIO_PASSWORD="${MINIO_PASSWORD:-MinioSecure2024!}"

echo -e "${BLUE}📦 Instalando dependências...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

echo -e "${BLUE}📝 Criando arquivo .env...${NC}"
cat > .env << EOF
# Database
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=frota2026

# JWT
JWT_SECRET=$JWT_SECRET

# Storage
STORAGE_BUCKET=frota-uploads
STORAGE_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=$MINIO_PASSWORD

# API
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/frota2026?schema=public
STORAGE_ENDPOINT=http://minio:9000
EOF

echo -e "${GREEN}✅ Arquivo .env criado${NC}"

echo -e "${BLUE}🐳 Parando containers antigos...${NC}"
docker compose -f docker-compose.vps.yml down 2>/dev/null || true

echo -e "${BLUE}🏗️  Building containers...${NC}"
docker compose -f docker-compose.vps.yml build --no-cache

echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
docker compose -f docker-compose.vps.yml up -d

echo -e "${YELLOW}⏳ Aguardando PostgreSQL iniciar...${NC}"
sleep 10

echo -e "${BLUE}🔄 Executando migrações...${NC}"
docker compose -f docker-compose.vps.yml exec -T api npx prisma migrate deploy || {
    echo -e "${YELLOW}⚠️  Tentando caminho alternativo...${NC}"
    docker compose -f docker-compose.vps.yml exec -T api sh -c "cd apps/api && npx prisma migrate deploy"
}

echo ""
echo -e "${GREEN}✅ Deploy Completo!${NC}"
echo "=================================="
echo ""
echo -e "${BLUE}🌐 Acesse sua aplicação:${NC}"
echo "   Frontend: https://johnatamoreira.com.br"
echo "   API: https://johnatamoreira.com.br/api"
echo ""
echo -e "${YELLOW}📝 Credenciais salvas em .env${NC}"
echo ""
echo -e "${BLUE}🔍 Ver logs:${NC}"
echo "   docker compose -f docker-compose.vps.yml logs -f"
echo ""
echo -e "${BLUE}🔄 Redeploy:${NC}"
echo "   git pull && ./deploy-ssh.sh"
echo ""
