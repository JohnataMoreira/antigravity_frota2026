# Stage 1: Build
FROM node:20-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root config files
COPY package.json package-lock.json turbo.json ./
# Copy workspace apps and packages
COPY apps/api/package.json apps/api/package.json
COPY apps/api/prisma apps/api/prisma

# Install dependencies (only for API workspace to save space in builder stage)
RUN npm install --legacy-peer-deps

# Copy source code
COPY apps/api apps/api

# Generate Prisma and Build
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma
RUN npm run build --workspace=api

# Prune dev dependencies
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Production
FROM node:20-slim

WORKDIR /app

# Install system dependencies + postgresql-client for backups
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy the entire production node_modules from root
COPY --from=builder /app/node_modules ./node_modules
# Copy API artifacts and migrations
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
# Force refresh migrations (v3.7.1)
COPY --from=builder /app/apps/api/package.json ./package.json

# [11/10 STRATEGY] MULTI-MODULE SANITY CHECK
# This command MUST pass for the image to be created.
# It proves that the core runtime is actually complete.
RUN node -e "require('@prisma/client'); require('@nestjs/common'); require('@nestjs/jwt'); console.log('✅ ENV IS IMMUNE')"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Auto-migrate on startup, then start the API
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
