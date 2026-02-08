# Stage 1: Build (Stable fat image)
FROM node:20 AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy EVERYTHING except node_modules
COPY . .

# [11/10 STRATEGY] Sync all dependencies at ROOT
# Since we added prisma/@prisma/client to root package.json, this installs them here
RUN npm install --legacy-peer-deps

# [11/10 STRATEGY] Generate Prisma from ROOT
# Using npx from root now finds the hoisted prisma binary instantly
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API
RUN npm run build -w api

# Prune to production only at the root
RUN npm prune --production --legacy-peer-deps

# Stage 2: Production (Slim image)
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# [11/10 STRATEGY] Copy the entire production node_modules from root
COPY --from=builder /app/node_modules ./node_modules
# Copy API artifacts
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# [11/10 STRATEGY] ULTIMATE SANITY CHECK
# This command MUST pass for the image to be created.
# It proves that Node + Prisma Client are correctly linked in the production image.
RUN node -e "require('@prisma/client')"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["node", "dist/main.js"]
