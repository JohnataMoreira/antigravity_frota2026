# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy EVERYTHING except node_modules (handled by .dockerignore)
# This is the most robust way to handle monorepo configurations
COPY . .

# Clean install all dependencies at root
RUN npm install --legacy-peer-deps

# Generate Prisma Client using explicit binary path
RUN ./node_modules/.bin/prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API (output goes to apps/api/dist)
RUN npm run build -w api

# Prune to production only
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy prepared production node_modules (including Prisma Client)
COPY --from=builder /app/node_modules ./node_modules

# Copy API artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000

# Final sanity check: Can Node find the Prisma client?
RUN node -e "require('@prisma/client')"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
