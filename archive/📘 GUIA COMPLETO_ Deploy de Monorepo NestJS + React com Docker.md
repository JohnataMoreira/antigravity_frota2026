# 📘 GUIA COMPLETO: Deploy de Monorepo NestJS + React com Docker

**Para:** Antigravity  
**De:** Manus AI  
**Data:** 14 de Fevereiro de 2026  
**Projeto:** Frota2026 MVP

---

## 🎯 OBJETIVO DESTE GUIA

Este documento contém **TODAS as lições aprendidas** durante o deploy do Frota2026 MVP, desde o `pasted_content_50` até o sucesso final.

**Use este guia para garantir que o próximo deploy funcione NA PRIMEIRA TENTATIVA!**

---

## 📋 ÍNDICE

1. [Estrutura do Projeto](#estrutura-do-projeto)
2. [Dockerfiles Corretos](#dockerfiles-corretos)
3. [Docker Compose Correto](#docker-compose-correto)
4. [Variáveis de Ambiente](#variáveis-de-ambiente)
5. [Dependencies vs DevDependencies](#dependencies-vs-devdependencies)
6. [TypeScript Configuration](#typescript-configuration)
7. [Checklist Pré-Deploy](#checklist-pré-deploy)
8. [Troubleshooting](#troubleshooting)

---

## 1. ESTRUTURA DO PROJETO

```
antigravity_frota2026/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile          # ⚠️ ATENÇÃO AQUI!
│   │   └── verify-internal.js
│   └── web/                    # Frontend React/Vite
│       ├── src/
│       ├── package.json
│       ├── vite.config.ts
│       ├── nginx.conf
│       └── Dockerfile          # ⚠️ ATENÇÃO AQUI!
├── docker-compose.yml          # ⚠️ ATENÇÃO AQUI!
├── .env                        # ⚠️ CRIAR ESTE ARQUIVO!
├── package.json                # Root package.json
└── tsconfig.json               # Root tsconfig.json
```

---

## 2. DOCKERFILES CORRETOS

### 🔴 REGRA FUNDAMENTAL: BUILD CONTEXT

**Quando você define `build.context: ./apps/api` no docker-compose.yml:**

- O Docker copia **APENAS** o conteúdo de `./apps/api/` para dentro do container
- O WORKDIR `/app` dentro do container contém `apps/api/*`, NÃO a raiz do monorepo
- Todos os caminhos no Dockerfile devem ser **relativos ao context**, não à raiz do projeto

**❌ ERRADO:**
```dockerfile
COPY apps/api/dist ./dist
COPY apps/api/prisma ./prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
```

**✅ CORRETO:**
```dockerfile
COPY dist ./dist
COPY prisma ./prisma
RUN npx prisma generate --schema=prisma/schema.prisma
```

---

### ✅ DOCKERFILE CORRETO - Backend (apps/api/Dockerfile)

```dockerfile
# -----------------------------------------------------------------------------
# STAGE 1: BUILD
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate --schema=prisma/schema.prisma

# Build TypeScript
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2: PRODUCTION
# -----------------------------------------------------------------------------
FROM node:20-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar APENAS production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copiar arquivos compilados do builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/verify-internal.js ./verify-internal.js

# Gerar Prisma Client novamente (necessário em produção)
RUN npx prisma generate --schema=prisma/schema.prisma

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node verify-internal.js || exit 1

# Comando de inicialização
CMD ["node", "dist/main.js"]
```

---

### ✅ DOCKERFILE CORRETO - Frontend (apps/web/Dockerfile)

```dockerfile
# -----------------------------------------------------------------------------
# STAGE 1: BUILD
# -----------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependências
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Build Vite
RUN npm run build

# -----------------------------------------------------------------------------
# STAGE 2: PRODUCTION (Nginx)
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Copiar arquivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expor porta
EXPOSE 80

# Comando de inicialização
CMD ["nginx", "-g", "daemon off;"]
```

---

## 3. DOCKER COMPOSE CORRETO

### ✅ docker-compose.yml COMPLETO

```yaml
version: '3.8'

services:
  # ---------------------------------------------------------------------------
  # DATABASE (PostgreSQL)
  # ---------------------------------------------------------------------------
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: frota2026
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - frota-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # ---------------------------------------------------------------------------
  # OBJECT STORAGE (MinIO)
  # ---------------------------------------------------------------------------
  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    volumes:
      - minio_data:/data
    networks:
      - frota-network

  # ---------------------------------------------------------------------------
  # BACKEND API (NestJS)
  # ---------------------------------------------------------------------------
  api:
    build:
      context: ./apps/api          # ⚠️ Build context = apps/api
      dockerfile: Dockerfile
    restart: always
    ports:
      - "4000:3000"                # ⚠️ Porta externa diferente do Dokploy (3000)
    environment:
      DATABASE_URL: "postgresql://postgres:${DB_PASSWORD}@postgres:5432/frota2026?schema=public"
      JWT_SECRET: "${JWT_SECRET}"
      PORT: 3000
      STORAGE_ENDPOINT: "http://minio:9000"
      STORAGE_BUCKET: "frota-uploads"
      STORAGE_REGION: "us-east-1"
      AWS_ACCESS_KEY_ID: "minioadmin"
      AWS_SECRET_ACCESS_KEY: "minioadmin"
      AWS_S3_FORCE_PATH_STYLE: "true"
    networks:
      - frota-network
      - dokploy-network
    depends_on:
      postgres:
        condition: service_healthy
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frota-api.rule=Host(`frota.johnatamoreira.com.br`) && PathPrefix(`/api`)"
      - "traefik.http.routers.frota-api.entrypoints=websecure"
      - "traefik.http.routers.frota-api.tls.certresolver=letsencrypt"
      - "traefik.http.services.frota-api.loadbalancer.server.port=3000"
      - "traefik.docker.network=dokploy-network"
      - "traefik.http.routers.frota-socket.rule=Host(`frota.johnatamoreira.com.br`) && PathPrefix(`/socket.io`)"
      - "traefik.http.routers.frota-socket.entrypoints=websecure"
      - "traefik.http.routers.frota-socket.tls.certresolver=letsencrypt"
      - "traefik.http.services.frota-socket.loadbalancer.server.port=3000"

  # ---------------------------------------------------------------------------
  # FRONTEND WEB (React/Vite)
  # ---------------------------------------------------------------------------
  web:
    build:
      context: ./apps/web          # ⚠️ Build context = apps/web
      dockerfile: Dockerfile
    restart: always
    ports:
      - "4001:80"                  # ⚠️ Porta externa diferente
    environment:
      VITE_API_URL: "https://frota.johnatamoreira.com.br/api"
      NEXT_PUBLIC_API_URL: "https://frota.johnatamoreira.com.br/api"
    networks:
      - frota-network
      - dokploy-network
    depends_on:
      - api
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frota-web.rule=Host(`frota.johnatamoreira.com.br`)"
      - "traefik.http.routers.frota-web.entrypoints=websecure"
      - "traefik.http.routers.frota-web.tls.certresolver=letsencrypt"
      - "traefik.http.services.frota-web.loadbalancer.server.port=80"
      - "traefik.docker.network=dokploy-network"

# -----------------------------------------------------------------------------
# NETWORKS & VOLUMES
# -----------------------------------------------------------------------------
networks:
  frota-network:
    driver: bridge
  dokploy-network:
    external: true

volumes:
  postgres_data:
  minio_data:
```

---

## 4. VARIÁVEIS DE AMBIENTE

### ✅ Arquivo .env (CRIAR NA RAIZ DO PROJETO)

```env
# Database
DB_PASSWORD=Frota2026_PostgreSQL_Secure_Pass_2024!

# JWT
JWT_SECRET=Frota2026_JWT_Super_Secret_Key_For_Authentication_2024!
```

### ⚠️ IMPORTANTE:

1. **NUNCA commite o `.env` no Git!** Adicione ao `.gitignore`
2. **Crie o `.env` ANTES de fazer `docker-compose up`**
3. **Se mudar a senha do PostgreSQL, você DEVE remover o volume:**
   ```bash
   docker-compose down
   docker volume rm antigravity_frota2026_postgres_data
   docker-compose up -d
   ```

---

## 5. DEPENDENCIES VS DEVDEPENDENCIES

### 🔴 REGRA FUNDAMENTAL:

**Bibliotecas usadas em RUNTIME devem estar em `dependencies`, NÃO em `devDependencies`!**

### ❌ ERROS COMUNS:

```json
{
  "devDependencies": {
    "uuid": "^8.3.2",           // ❌ ERRADO! Usado em runtime
    "react-is": "^18.2.0",      // ❌ ERRADO! Usado pelo recharts
    "@types/node": "^20.0.0"    // ✅ CORRETO! Apenas para desenvolvimento
  }
}
```

### ✅ CORRETO:

```json
{
  "dependencies": {
    "uuid": "^8.3.2",           // ✅ CORRETO! Usado em runtime
    "react-is": "^18.2.0"       // ✅ CORRETO! Usado pelo recharts
  },
  "devDependencies": {
    "@types/node": "^20.0.0",   // ✅ CORRETO! Apenas para desenvolvimento
    "@types/uuid": "^8.3.4"     // ✅ CORRETO! Apenas para desenvolvimento
  }
}
```

### 🔍 COMO IDENTIFICAR:

**Se a biblioteca é importada no código que roda em produção, ela DEVE estar em `dependencies`!**

```typescript
// Este código roda em produção?
import { v4 as uuidv4 } from 'uuid';  // ✅ SIM! uuid deve estar em dependencies

// Este código roda em produção?
import type { UUID } from 'uuid';     // ❌ NÃO! @types/uuid pode estar em devDependencies
```

---

## 6. TYPESCRIPT CONFIGURATION

### 🔴 PROBLEMA: Class constructor cannot be invoked without 'new'

**Causa:** TypeScript compilando para ES5, mas Prisma Client usa classes ES6.

### ✅ SOLUÇÃO: apps/api/tsconfig.json

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "noEmit": false,
    "module": "CommonJS",
    "declaration": false,
    "baseUrl": "./",
    "types": ["node", "jest"],
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "esModuleInterop": true,           // ⚠️ OBRIGATÓRIO!
    "allowSyntheticDefaultImports": true,  // ⚠️ OBRIGATÓRIO!
    "skipLibCheck": true,              // ⚠️ OBRIGATÓRIO!
    "target": "ES2020"                 // ⚠️ OBRIGATÓRIO! NÃO use ES5!
  },
  "include": ["src/**/*"]
}
```

### 🔍 FLAGS OBRIGATÓRIAS:

- **`esModuleInterop: true`** - Permite importar CommonJS como ES6
- **`allowSyntheticDefaultImports: true`** - Permite default imports
- **`skipLibCheck: true`** - Pula checagem de tipos em node_modules
- **`target: "ES2020"`** - Compila para ES2020 (suporta classes ES6)

---

## 7. CHECKLIST PRÉ-DEPLOY

### ✅ ANTES DE FAZER `docker-compose up`:

#### **1. Verificar Dockerfiles:**
- [ ] Build context correto no docker-compose.yml
- [ ] Caminhos COPY relativos ao context
- [ ] Prisma schema path correto
- [ ] Comandos npm sem flags de workspace (`-w`)

#### **2. Verificar package.json:**
- [ ] `uuid` em dependencies (não devDependencies)
- [ ] `react-is` em dependencies (não devDependencies)
- [ ] Todas as libs usadas em runtime em dependencies

#### **3. Verificar tsconfig.json:**
- [ ] `target: "ES2020"` (não ES5)
- [ ] `esModuleInterop: true`
- [ ] `allowSyntheticDefaultImports: true`
- [ ] `skipLibCheck: true`

#### **4. Verificar variáveis de ambiente:**
- [ ] Arquivo `.env` criado na raiz
- [ ] `DB_PASSWORD` definido
- [ ] `JWT_SECRET` definido
- [ ] `.env` adicionado ao `.gitignore`

#### **5. Verificar NestJS modules:**
- [ ] `JwtModule` importado em todos os módulos que usam `JwtService`
- [ ] Exemplo: `LocationsModule` deve importar `JwtModule`

#### **6. Verificar portas:**
- [ ] Porta 3000 está livre? (Dokploy usa 3000)
- [ ] Se não, usar portas diferentes (ex: 4000, 4001)

#### **7. Verificar DNS:**
- [ ] Domínio configurado no Cloudflare
- [ ] Registro A apontando para o IP do servidor
- [ ] Proxy desabilitado (ícone cinza, não laranja)

---

## 8. TROUBLESHOOTING

### 🔴 ERRO: "Cannot find module 'uuid'"

**Causa:** `uuid` está em devDependencies, mas é usado em runtime.

**Solução:**
```bash
cd apps/api
npm install uuid --save --legacy-peer-deps
npm uninstall uuid --save-dev
```

---

### 🔴 ERRO: "Class constructor t cannot be invoked without 'new'"

**Causa:** TypeScript compilando para ES5.

**Solução:** Adicionar `"target": "ES2020"` no `apps/api/tsconfig.json`

---

### 🔴 ERRO: "Nest can't resolve dependencies of the LocationsGateway"

**Causa:** `JwtModule` não está importado no `LocationsModule`.

**Solução:**
```typescript
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [LocationsGateway],
})
export class LocationsModule {}
```

---

### 🔴 ERRO: "Authentication failed against database server"

**Causa:** Senha do PostgreSQL não configurada ou volume com senha antiga.

**Solução:**
```bash
# 1. Criar .env com DB_PASSWORD
cat > .env << 'EOF'
DB_PASSWORD=sua_senha_aqui
JWT_SECRET=seu_secret_aqui
EOF

# 2. Remover volume antigo
docker-compose down
docker volume rm antigravity_frota2026_postgres_data

# 3. Recriar
docker-compose up -d
```

---

### 🔴 ERRO: "Bind for 0.0.0.0:3000 failed: port is already allocated"

**Causa:** Dokploy está usando a porta 3000.

**Solução:** Usar portas diferentes no docker-compose.yml:
```yaml
api:
  ports:
    - "4000:3000"  # Porta externa 4000, interna 3000

web:
  ports:
    - "4001:80"    # Porta externa 4001, interna 80
```

---

### 🔴 ERRO: "file or directory not found" (Dockerfile COPY)

**Causa:** Caminho incorreto (não relativo ao build context).

**Solução:** Verificar build context e ajustar caminhos:
```dockerfile
# Se build.context: ./apps/api
# ❌ ERRADO:
COPY apps/api/dist ./dist

# ✅ CORRETO:
COPY dist ./dist
```

---

### 🔴 ERRO: "Rollup failed to resolve import 'react-is'"

**Causa:** `react-is` não está instalado ou está em devDependencies.

**Solução:**
```bash
cd apps/web
npm install react-is --save --legacy-peer-deps
```

---

## 🎓 RESUMO DAS LIÇÕES APRENDIDAS

### 1. **Build Context é FUNDAMENTAL**
- Entenda onde o Docker está copiando os arquivos
- Todos os caminhos devem ser relativos ao context

### 2. **Dependencies vs DevDependencies importa!**
- Runtime = dependencies
- Desenvolvimento = devDependencies
- `npm install --omit=dev` remove devDependencies

### 3. **TypeScript Target importa!**
- Prisma Client precisa de ES2020+
- ES5 causa erro de class constructor

### 4. **Variáveis de Ambiente são imutáveis em volumes**
- PostgreSQL só aplica senha na primeira criação
- Para mudar, remova o volume

### 5. **Portas podem conflitar**
- Dokploy usa 3000
- Sempre verifique portas em uso

### 6. **NestJS precisa de módulos importados**
- `JwtService` precisa de `JwtModule`
- Não assume imports automáticos

### 7. **Traefik pode ter problemas de compatibilidade**
- API Docker antiga pode não detectar containers
- Workaround: expor portas diretamente

### 8. **Sempre teste localmente primeiro**
- `curl http://localhost:PORT/api/health`
- Verifique logs: `docker logs CONTAINER_NAME`

---

## 🚀 COMANDOS ÚTEIS

### **Build e Deploy:**
```bash
# Build completo
docker-compose build --no-cache

# Subir containers
docker-compose up -d

# Ver logs
docker-compose logs -f api
docker-compose logs -f web

# Restart
docker-compose restart

# Down completo
docker-compose down
```

### **Verificar Status:**
```bash
# Ver containers
docker ps

# Ver portas
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Testar endpoints
curl http://localhost:4000/api/health
curl http://localhost:4001/
```

### **Limpar Tudo:**
```bash
# Parar e remover containers
docker-compose down

# Remover volumes
docker volume rm antigravity_frota2026_postgres_data
docker volume rm antigravity_frota2026_minio_data

# Remover imagens
docker rmi antigravity_frota2026-api
docker rmi antigravity_frota2026-web
```

---

## 📚 REFERÊNCIAS

- [Docker Multi-Stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Prisma with Docker](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-docker)
- [NestJS with Docker](https://docs.nestjs.com/recipes/prisma#docker)
- [Vite Build](https://vitejs.dev/guide/build.html)

---

## ✅ CHECKLIST FINAL

Antes de commitar e fazer deploy, verifique:

- [ ] Dockerfiles com caminhos corretos
- [ ] docker-compose.yml com build contexts corretos
- [ ] package.json com dependencies corretas
- [ ] tsconfig.json com target ES2020
- [ ] .env criado e configurado
- [ ] .env adicionado ao .gitignore
- [ ] JwtModule importado onde necessário
- [ ] Portas não conflitam com Dokploy
- [ ] DNS configurado (se necessário)
- [ ] Testado localmente antes de commitar

---

**Criado por:** Manus AI  
**Data:** 14/02/2026  
**Versão:** 1.0  
**Status:** ✅ Validado em produção

---

**🎯 USE ESTE GUIA E O PRÓXIMO DEPLOY FUNCIONARÁ NA PRIMEIRA TENTATIVA!** 🚀
