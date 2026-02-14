# Frota2026 - Fleet Management System

A modern, offline-first SaaS for fleet management.

## Tech Stack
- **Backend**: NestJS, Prisma, PostgreSQL
- **Web**: React, Vite, TailwindCSS, TanStack Query
- **Mobile**: React Native, Expo, WatermelonDB (Offline-first)
- **Infra**: Docker Compose, Turborepo

## getting Started

### 1. Prerequisites
- Node.js 22+
- Docker & Docker Compose
- NPM / Turbo

### 2. Local Infrastructure Setup
Start the database and storage services:
```bash
docker-compose up -d
```

### 3. Application Setup
We use [Turborepo](https://turbo.build/) to manage the monorepo.

```bash
# Install root dependencies
npm install

# Build all apps
npm run build

# Start core services in dev mode
# (This will start API and Web)
npm run dev
```

---

## 🚀 Production Deployment Guide

The system is designed to be deployed via Docker Compose behind a Traefik reverse proxy.

### 1. Environment Configuration
Copy the production example and fill in the secrets:
```bash
cp .env.production.example .env
# Edit .env with strong DB_PASSWORD and JWT_SECRET
```

### 2. Protocolo de Deploy (Obrigatório)
Sempre valide o build localmente antes de qualquer alteração no servidor:
```bash
# Validar Backend
cd apps/api && npm run build
# Validar Frontend
cd ../web && npm run build
```

### 3. Deploying with Docker
```bash
# Clean build and up
docker-compose build --no-cache
docker-compose up -d
```

---

## 🏗️ Project Structure
- `apps/api`: NestJS Backend (Prisma, PostgreSQL)
- `apps/web`: React Frontend (Vite, Tailwind)
- `apps/mobile`: React Native Mobile App (Expo)
- `packages/`: Shared packages (planned)

---

## 🔐 Security Protocols

- **JWT Rotation:** Generate a new `JWT_SECRET` for every production environment using `openssl rand -base64 32`.
- **Database Backups:** Use the provided script `scripts/backup-db.sh` to perform daily backups.
- **Passwords:** Never store raw passwords. PRODUCTION passwords MUST be rotated using the provided SQL update scripts.

---

## 🧪 Testing

### Backend (API)
```bash
cd apps/api
npm run test
```

### Frontend (Web)
```bash
cd apps/web
npm run test
```
