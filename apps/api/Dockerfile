# Stage 1: Build (Fat image for a stable build environment)
FROM node:20 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy EVERYTHING except node_modules
# This prevents incomplete monorepo workspace resolution
COPY . .

# Clean install all dependencies at root
RUN npm install --legacy-peer-deps

# [11/10 STRATEGY] Generate Prisma from ROOT
# This forces the client into /app/node_modules/@prisma/client instead of local apps/api/node_modules
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API
RUN npm run build -w api

# Prune to production only
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production (Slim image for efficiency)
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy prepared production node_modules (including hoisted Prisma Client)
COPY --from=builder /app/node_modules ./node_modules
# Copy API artifacts (dist is located in apps/api/dist after build -w api)
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# [11/10 STRATEGY] FINAL SANITY CHECK
# If Node can't find Prisma Client here, the build WILL fail right now
RUN node -e "require('@prisma/client')"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
