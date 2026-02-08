# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy only package files first for better caching
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY tsconfig.json ./
COPY apps/api/tsconfig.json ./apps/api/

# Install dependencies (Clean slate)
RUN npm install --legacy-peer-deps

# Copy rest of the code
COPY apps/api ./apps/api

# Generate Prisma Client and Build
WORKDIR /app/apps/api
RUN ../../node_modules/.bin/prisma generate
RUN npm run build

# Prune to production only
WORKDIR /app
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy prepared production node_modules and code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
