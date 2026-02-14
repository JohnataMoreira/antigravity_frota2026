# 📘 Guia de Padrões de Desenvolvimento - Frota2026

**Desenvolvedor:** Antigravity (JohnataMoreira)  
**Projeto:** Frota2026 - Sistema de Gestão de Frotas  
**Objetivo:** Evitar problemas de deploy e garantir qualidade do código

---

## 🎯 Protocolo Obrigatório: Testar Antes de Commitar

### ⚠️ REGRA DE OURO

**NUNCA commitar código sem testar localmente primeiro!**

Este protocolo foi estabelecido após múltiplos problemas de build em produção que poderiam ter sido evitados com testes locais.

### ✅ Checklist Pré-Commit

Antes de fazer `git commit` e `git push`, **SEMPRE** executar:

```bash
# 1. Build do Backend (API)
cd apps/api
npm run build

# 2. Build do Frontend (Web)
cd ../web
npm run build

# 3. Verificar TypeScript
npm run type-check  # ou tsc --noEmit

# 4. Executar testes (se existirem)
npm run test

# 5. Build Docker local (opcional mas recomendado)
cd ../..
docker-compose build

# 6. Subir localmente e testar
docker-compose up -d
curl http://localhost:3000/api/health
```

### 🚫 O Que NÃO Fazer

❌ Commitar código que não compila  
❌ Commitar sem testar o build  
❌ Adicionar dependências sem testar  
❌ Modificar tsconfig.json sem verificar impacto  
❌ Remover código sem verificar dependências  
❌ Fazer "commit rápido" sem validação  

---

## 🔧 Problemas Encontrados e Como Evitar

### 1. ❌ Erro: TypeScript ES5 vs ES2020

**Problema Encontrado:**
```
Error: Class constructor PrismaClient cannot be invoked without 'new'
```

**Causa:** `tsconfig.json` com `target: "ES5"` incompatível com Prisma Client.

**Solução Permanente:**

**Arquivo:** `apps/api/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",  // ← SEMPRE ES2020 ou superior
    "module": "commonjs",
    "lib": ["ES2020"],
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strict": true,
    "resolveJsonModule": true,
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "sourceMap": true,
    "incremental": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  },
  "include": ["src/**/*", "prisma/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**✅ Regra:**
- **Backend NestJS:** `target: "ES2020"` (obrigatório para Prisma)
- **Frontend React:** `target: "ESNext"` (recomendado)

### 2. ❌ Erro: Dependências Faltando

**Problema Encontrado:**
```
Cannot find module 'uuid'
Cannot find module 'axios'
```

**Causa:** Dependências usadas no código mas não declaradas em `package.json`.

**Solução Permanente:**

**Sempre instalar dependências corretamente:**
```bash
# Para dependências de produção
npm install <package>

# Para dependências de desenvolvimento
npm install -D <package>

# NUNCA usar import sem instalar antes!
```

**✅ Regra:**
- Antes de usar `import { v4 } from 'uuid'`, execute `npm install uuid`
- Antes de usar `import axios from 'axios'`, execute `npm install axios`
- Sempre verificar `package.json` após adicionar imports

### 3. ❌ Erro: Módulos Incompletos Commitados

**Problema Encontrado:**
```
Module '"@/services/InventoryService"' has no exported member 'InventoryService'
```

**Causa:** Módulos de Inventory/Stock commitados sem implementação completa.

**Solução Permanente:**

**Desenvolver features em branches separadas:**
```bash
# Criar branch para nova feature
git checkout -b feature/inventory-module

# Desenvolver e testar COMPLETAMENTE
# ... código ...

# Testar build
npm run build

# Só fazer merge quando 100% funcional
git checkout dev
git merge feature/inventory-module
```

**✅ Regra:**
- **Nunca commitar código incompleto na branch `dev`**
- Usar feature branches para desenvolvimento
- Fazer merge apenas quando feature estiver 100% funcional e testada

### 4. ❌ Erro: Schema Prisma Desatualizado

**Problema Encontrado:**
```
The column `User.pushToken` does not exist in the current database
The column `Incident.isDriverAtFault` does not exist in the current database
```

**Causa:** Schema Prisma modificado mas migrations não executadas.

**Solução Permanente:**

**Sempre que modificar `schema.prisma`:**

```bash
# 1. Criar migration
npx prisma migrate dev --name add_push_token_field

# 2. Gerar Prisma Client
npx prisma generate

# 3. Testar localmente
npm run build
npm run start:dev

# 4. Commitar schema + migration
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: adicionar campo pushToken ao User"
```

**✅ Regra:**
- **Sempre criar migrations** quando modificar `schema.prisma`
- **Nunca modificar schema sem migration**
- Commitar schema.prisma + pasta migrations juntos
- Testar migrations localmente antes de commitar

---

## 🐳 Docker e Docker Compose

### Configuração Correta do docker-compose.yml

**Labels do Traefik - Padrão Correto:**

```yaml
services:
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=dokploy-network"  # ← No topo, uma vez só
      
      # Router 1: API
      - "traefik.http.routers.frota-api.rule=Host(`frota.johnatamoreira.com.br`) && PathPrefix(`/api`)"
      - "traefik.http.routers.frota-api.entrypoints=websecure"
      - "traefik.http.routers.frota-api.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frota-api.service=frota-api"  # ← OBRIGATÓRIO
      - "traefik.http.services.frota-api.loadbalancer.server.port=3000"
      
      # Router 2: Socket.io
      - "traefik.http.routers.frota-socket.rule=Host(`frota.johnatamoreira.com.br`) && PathPrefix(`/socket.io`)"
      - "traefik.http.routers.frota-socket.entrypoints=websecure"
      - "traefik.http.routers.frota-socket.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frota-socket.service=frota-socket"  # ← OBRIGATÓRIO
      - "traefik.http.services.frota-socket.loadbalancer.server.port=3000"
      - "traefik.http.services.frota-socket.loadbalancer.sticky.cookie=true"

  web:
    build:
      context: ./apps/web
      dockerfile: Dockerfile
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=dokploy-network"
      - "traefik.http.routers.frota-web.rule=Host(`frota.johnatamoreira.com.br`)"
      - "traefik.http.routers.frota-web.entrypoints=websecure"
      - "traefik.http.routers.frota-web.tls.certresolver=letsencrypt"
      - "traefik.http.routers.frota-web.service=frota-web"  # ← OBRIGATÓRIO
      - "traefik.http.services.frota-web.loadbalancer.server.port=80"
```

**✅ Regras para Labels Traefik:**

1. **Sempre especificar `.service`** quando há múltiplos routers no mesmo container
2. **Um label `traefik.docker.network` por serviço**, no topo dos labels
3. **Não duplicar** o label `traefik.docker.network` em múltiplos lugares
4. **Usar nomes consistentes**: `frota-api`, `frota-socket`, `frota-web`

### Dockerfile - Boas Práticas

**Backend (NestJS):**
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM node:22-alpine

WORKDIR /app

# Copiar apenas o necessário
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/main"]
```

**Frontend (React/Vite):**
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Estágio de produção com Nginx
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 📦 Gerenciamento de Dependências

### package.json - Estrutura Recomendada

**Backend (apps/api/package.json):**
```json
{
  "name": "frota2026-api",
  "version": "1.0.0",
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/main",
    "test": "jest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/jwt": "^10.0.0",
    "@nestjs/passport": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.22.0",
    "bcrypt": "^5.1.1",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "uuid": "^9.0.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@types/node": "^20.0.0",
    "@types/bcrypt": "^5.0.0",
    "@types/passport-jwt": "^4.0.0",
    "@types/uuid": "^9.0.0",
    "prisma": "^5.22.0",
    "typescript": "^5.3.0",
    "ts-node": "^10.9.0"
  }
}
```

**✅ Regras:**
- **Versões fixas** para Prisma (`^5.22.0` - não usar `latest`)
- **Tipos TypeScript** para todas as libs JS (`@types/*`)
- **Scripts padronizados** (`build`, `start`, `test`, `type-check`)

---

## 🗄️ Prisma - Boas Práticas

### Schema Prisma

**Estrutura Recomendada:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id             String    @id @default(uuid())
  organizationId String
  email          String    @unique
  passwordHash   String    // ← Sempre "passwordHash", não "password"
  role           Role      @default(DRIVER)
  name           String
  phone          String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  
  // Relações
  organization   Organization @relation(fields: [organizationId], references: [id])
  journeys       Journey[]
  
  @@index([organizationId])
  @@index([email])
}

enum Role {
  ADMIN
  MANAGER
  DRIVER
}
```

**✅ Regras:**
- **Sempre usar `uuid()`** para IDs
- **Sempre adicionar `createdAt` e `updatedAt`**
- **Sempre adicionar indexes** em campos de busca frequente
- **Usar nomes descritivos** (`passwordHash`, não `pwd`)
- **Documentar enums** com comentários se necessário

### Migrations

**Workflow Correto:**

```bash
# 1. Modificar schema.prisma
# 2. Criar migration
npx prisma migrate dev --name add_fuel_module

# 3. Verificar migration gerada
cat prisma/migrations/XXXXXX_add_fuel_module/migration.sql

# 4. Testar localmente
npm run start:dev

# 5. Commitar
git add prisma/schema.prisma
git add prisma/migrations/
git commit -m "feat: adicionar módulo de combustível"
```

**✅ Regras:**
- **Nunca editar migrations manualmente** (exceto em casos extremos)
- **Sempre usar nomes descritivos** para migrations
- **Testar migrations localmente** antes de commitar
- **Commitar schema + migrations juntos**

---

## 🎨 Frontend - Padrões React/TypeScript

### Estrutura de Componentes

**Padrão Recomendado:**
```typescript
// src/components/VehicleCard.tsx
import { FC } from 'react';

interface VehicleCardProps {
  vehicle: Vehicle;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const VehicleCard: FC<VehicleCardProps> = ({ 
  vehicle, 
  onEdit, 
  onDelete 
}) => {
  return (
    <div className="vehicle-card">
      <h3>{vehicle.plate}</h3>
      <p>{vehicle.model}</p>
      {onEdit && (
        <button onClick={() => onEdit(vehicle.id)}>
          Editar
        </button>
      )}
    </div>
  );
};
```

**✅ Regras:**
- **Sempre tipar props** com interfaces
- **Usar `FC<Props>`** para componentes funcionais
- **Exportar componentes nomeados** (`export const`, não `export default`)
- **Separar lógica de apresentação**

### Services (API Calls)

**Padrão Recomendado:**
```typescript
// src/services/VehicleService.ts
import axios from 'axios';
import { Vehicle, CreateVehicleDto } from '@/types';

const API_URL = import.meta.env.VITE_API_URL;

export class VehicleService {
  static async getAll(): Promise<Vehicle[]> {
    const response = await axios.get(`${API_URL}/vehicles`);
    return response.data;
  }

  static async create(data: CreateVehicleDto): Promise<Vehicle> {
    const response = await axios.post(`${API_URL}/vehicles`, data);
    return response.data;
  }

  static async update(id: string, data: Partial<CreateVehicleDto>): Promise<Vehicle> {
    const response = await axios.put(`${API_URL}/vehicles/${id}`, data);
    return response.data;
  }

  static async delete(id: string): Promise<void> {
    await axios.delete(`${API_URL}/vehicles/${id}`);
  }
}
```

**✅ Regras:**
- **Centralizar chamadas API** em services
- **Sempre tipar retornos** (`Promise<Type>`)
- **Usar variáveis de ambiente** para URLs
- **Tratar erros** com try/catch ou interceptors

---

## 🧪 Testes

### Testes Unitários (Backend)

**Exemplo:**
```typescript
// src/auth/auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, PrismaService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash password correctly', async () => {
    const password = '123456';
    const hash = await service.hashPassword(password);
    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$/);
  });
});
```

**✅ Regras:**
- **Testar lógica de negócio** crítica
- **Mockar dependências externas** (Prisma, APIs)
- **Usar describe/it** para organizar testes
- **Executar testes antes de commitar**

---

## 🔐 Segurança

### Senhas e Autenticação

**✅ FAZER:**
```typescript
// Sempre usar bcrypt com rounds >= 10
import * as bcrypt from 'bcrypt';

const hash = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hash);
```

**❌ NÃO FAZER:**
```typescript
// NUNCA armazenar senhas em texto plano
user.password = '123456';  // ❌ ERRADO

// NUNCA usar MD5 ou SHA1 para senhas
const hash = md5(password);  // ❌ INSEGURO
```

### Variáveis de Ambiente

**✅ FAZER:**
```bash
# .env (NUNCA commitar!)
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
JWT_SECRET="seu-secret-super-secreto-aqui"
```

```typescript
// Usar process.env
const jwtSecret = process.env.JWT_SECRET;
```

**❌ NÃO FAZER:**
```typescript
// NUNCA hardcodar secrets
const jwtSecret = "meu-secret-123";  // ❌ INSEGURO
```

---

## 📝 Git - Boas Práticas

### Commits Semânticos

**Padrão:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

**Exemplos:**
```bash
git commit -m "feat(fuel): adicionar módulo de abastecimento"
git commit -m "fix(auth): corrigir validação de token JWT"
git commit -m "docs: atualizar README com instruções de deploy"
git commit -m "refactor(vehicles): simplificar lógica de busca"
```

### Branches

**Estrutura:**
```
main          # Produção (protegida)
├── dev       # Desenvolvimento (branch padrão)
├── feature/fuel-module
├── feature/finance-dashboard
├── fix/login-error
└── hotfix/critical-bug
```

**Workflow:**
```bash
# Criar feature branch
git checkout dev
git pull origin dev
git checkout -b feature/fuel-module

# Desenvolver e testar
# ... código ...
npm run build  # ✅ Testar!

# Commitar
git add .
git commit -m "feat(fuel): adicionar CRUD de abastecimentos"

# Fazer merge
git checkout dev
git merge feature/fuel-module
git push origin dev
```

---

## 🚀 Deploy

### Checklist Pré-Deploy

Antes de fazer deploy em produção:

- [ ] ✅ Código compila sem erros (`npm run build`)
- [ ] ✅ Testes passando (`npm run test`)
- [ ] ✅ TypeScript sem erros (`npm run type-check`)
- [ ] ✅ Migrations testadas localmente
- [ ] ✅ Docker build funciona (`docker-compose build`)
- [ ] ✅ Variáveis de ambiente configuradas
- [ ] ✅ Backup do banco de dados criado
- [ ] ✅ Changelog atualizado
- [ ] ✅ Documentação atualizada

### Rollback

Se algo der errado em produção:

```bash
# 1. Reverter para commit anterior
git revert HEAD
git push origin dev

# 2. Ou fazer rollback para versão específica
git reset --hard <commit-hash>
git push origin dev --force

# 3. Rebuild e redeploy
docker-compose down
docker-compose build
docker-compose up -d
```

---

## 📚 Recursos e Referências

### Documentação Oficial
- **NestJS:** https://docs.nestjs.com/
- **Prisma:** https://www.prisma.io/docs/
- **React:** https://react.dev/
- **Vite:** https://vitejs.dev/
- **Traefik:** https://doc.traefik.io/traefik/

### Ferramentas Recomendadas
- **VS Code Extensions:**
  - Prisma
  - ESLint
  - Prettier
  - GitLens
  - Docker

### Scripts Úteis

**Verificação Completa:**
```bash
#!/bin/bash
# check-before-commit.sh

echo "🔍 Verificando código..."

echo "1. TypeScript Backend..."
cd apps/api && npm run type-check || exit 1

echo "2. Build Backend..."
npm run build || exit 1

echo "3. TypeScript Frontend..."
cd ../web && npm run type-check || exit 1

echo "4. Build Frontend..."
npm run build || exit 1

echo "✅ Tudo OK! Pode commitar."
```

---

## ✅ Resumo - Regras de Ouro

1. **🧪 SEMPRE testar build localmente antes de commitar**
2. **📦 SEMPRE instalar dependências corretamente**
3. **🗄️ SEMPRE criar migrations ao modificar schema Prisma**
4. **🐳 SEMPRE especificar `.service` nos labels do Traefik**
5. **🎯 SEMPRE usar `target: ES2020` no tsconfig do backend**
6. **🔐 NUNCA commitar senhas ou secrets**
7. **🌿 NUNCA commitar código incompleto na branch dev**
8. **📝 SEMPRE usar commits semânticos**
9. **🔄 SEMPRE fazer backup antes de deploy**
10. **📖 SEMPRE documentar mudanças importantes**

---

**Dúvidas?** Consulte este guia ou peça ajuda ao Manus AI Agent!

**Última atualização:** 14 de Fevereiro de 2026  
**Versão:** 1.0
