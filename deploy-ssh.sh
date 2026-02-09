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

# Carregar variáveis existentes
if [ -f .env ]; then
    echo -e "${YELLOW}ℹ️ Carregando variáveis existentes do .env...${NC}"
    export $(grep -v '^#' .env | xargs)
fi

# [12/10 STRATEGY] Detectar comando Docker Compose
if docker compose version >/dev/null 2>&1; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

# [12/10 STRATEGY] Validação de Segurança de Senha
# Se a senha contiver caracteres não-hexadecimais, forçamos a regeneração
# Isso limpa senhas antigas do "estilo base64" que causavam o erro P1000
FORCE_RESET=false
if [[ ! "$POSTGRES_PASSWORD" =~ ^[0-9a-f]+$ ]]; then
    echo -e "${YELLOW}⚠️ Senha antiga ou insegura detectada. Regenerando para formato URL-Safe...${NC}"
    POSTGRES_PASSWORD=$(openssl rand -hex 24)
    FORCE_RESET=true
fi

# [12/10 STRATEGY] Garantir estabilidade do JWT_SECRET
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}ℹ️ Gerando novo JWT_SECRET...${NC}"
    JWT_SECRET=$(openssl rand -hex 48)
else
    echo -e "${GREEN}✅ JWT_SECRET existente preservado${NC}"
fi

MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-MinioSecure2024!}"

echo -e "${BLUE}📦 Instalando dependências...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
fi

if ! command -v $COMPOSE_CMD &> /dev/null && [ "$COMPOSE_CMD" == "docker-compose" ]; then
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
MINIO_ROOT_PASSWORD=$MINIO_ROOT_PASSWORD

# API
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$POSTGRES_PASSWORD@postgres:5432/frota2026?schema=public
STORAGE_ENDPOINT=http://minio:9000
EOF

echo -e "${GREEN}✅ Arquivo .env criado${NC}"

echo -e "${BLUE}🐳 Parando containers antigos...${NC}"
if [ "$FORCE_RESET" = true ]; then
    echo -e "${RED}⚠️  Senha alterada! Resetando volumes para aplicar novas credenciais...${NC}"
    $COMPOSE_CMD -f docker-compose.vps.yml down -v --remove-orphans 2>/dev/null || true
else
    $COMPOSE_CMD -f docker-compose.vps.yml down --remove-orphans 2>/dev/null || true
fi

echo -e "${BLUE}🏗️  Building containers...${NC}"
$COMPOSE_CMD -f docker-compose.vps.yml build --no-cache

echo -e "${BLUE}🚀 Iniciando serviços...${NC}"
if ! $COMPOSE_CMD -f docker-compose.vps.yml up -d --force-recreate; then
    echo -e "${RED}❌ Erro ao subir os containers!${NC}"
    $COMPOSE_CMD -f docker-compose.vps.yml logs
    exit 1
fi

echo -e "${YELLOW}⏳ Aguardando PostgreSQL iniciar...${NC}"
sleep 10

echo -e "${BLUE}🔄 Sincronizando esquema do banco (db push)...${NC}"
$COMPOSE_CMD -f docker-compose.vps.yml exec -T api npx prisma db push --accept-data-loss || {
    echo -e "${YELLOW}⚠️ Falha na sincronização do banco. Verificando logs da API...${NC}"
    $COMPOSE_CMD -f docker-compose.vps.yml logs api
    exit 1
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
echo "   $COMPOSE_CMD -f docker-compose.vps.yml logs -f"
echo ""
echo -e "${BLUE}🔄 Redeploy:${NC}"
echo "   git pull && ./deploy-ssh.sh"
echo ""
