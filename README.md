# Frota2026 - Fleet Management System

A modern, offline-first SaaS for fleet management.

## Tech Stack
- **Backend**: NestJS, Prisma, PostgreSQL
- **Web**: React, Vite, TailwindCSS, TanStack Query
- **Mobile**: React Native, Expo, WatermelonDB (Offline-first)
- **Infra**: Docker Compose, Turborepo

## getting Started

### 1. Prerequisites
- Node.js 18+
- Docker & Docker Compose
- NPM

### 2. Infrastructure Setup
Start the database and storage services:
```bash
docker-compose up -d
```

### 3. Backend Setup
```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```
API will be available at `http://localhost:3000`.

### 4. Web Admin Panel Setup
```bash
cd apps/web
npm run dev
```
Access at `http://localhost:5173`.

**Login Credentials (Demo):**
- Register a new organization on the Login screen.
- Or use seeded data if applicable.

### 5. Mobile App Setup
```bash
cd apps/mobile
npx expo start
```
- Use Expo Go or Android Emulator.
- Ensure your device can reach the Backend IP (update `API_URL` in `apps/mobile/src/services/sync.ts` and `apps/mobile/app/login.tsx` if running on physical device).

## Features Implemented
- **Multi-tenancy**: Organization-based data isolation.
- **Vehicles CRUD**: Manage fleet inventory.
- **Drivers Management**: Register and monitor drivers.
- **Mobile Journey**: Offline-capable journey tracking (Start/End).
- **Dashboard**: Real-time fleet overview.
