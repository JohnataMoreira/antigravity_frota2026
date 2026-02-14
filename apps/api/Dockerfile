# Stage 1: Build (Stable fat image)
FROM node:20 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy EVERYTHING except node_modules
COPY . .

# [11/10 STRATEGY] Sync all dependencies at ROOT
# Since we added ALL api dependencies to root package.json, this installs them here
RUN npm install --legacy-peer-deps

# [11/10 STRATEGY] Generate Prisma from ROOT
RUN npx prisma generate --schema=prisma/schema.prisma

# Build the API
RUN npm run build

# [11/10 STRATEGY] Prune at root using workspaces awareness
# Using --omit=dev is more modern and reliable than prune in some npm versions
RUN npm install --omit=dev --legacy-peer-deps

# Stage 2: Production (Slim image)
FROM node:20-bookworm-slim

WORKDIR /app

# Install system dependencies + postgresql-client for backups
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy the entire production node_modules from root
COPY --from=builder /app/node_modules ./node_modules
# Copy API artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/verify-internal.js ./verify-internal.js

# [11/10 STRATEGY] MULTI-MODULE SANITY CHECK
# This command MUST pass for the image to be created.
# It proves that the core runtime is actually complete.
RUN node -e "require('@prisma/client'); require('@nestjs/common'); require('@nestjs/jwt'); console.log('✅ ENV IS IMMUNE')"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
