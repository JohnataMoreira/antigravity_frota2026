# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies (needed for some native modules if they crop up)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root configurations (needed for workspace install)
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY tsconfig.json ./
COPY apps/api/tsconfig.json ./apps/api/

# Install ALL dependencies (monorepo install)
RUN npm install

# Copy source code
COPY apps/api ./apps/api

# Generate Prisma and Build
WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20-bookworm-slim

WORKDIR /app

# Install openssl (Prisma requirement)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy ONLY the API package file
COPY apps/api/package*.json ./

# Install production dependencies
# We also install prisma cli to ensure npx prisma works in production
RUN npm install --omit=dev && npm install prisma@5.10.2

# Copy Prisma schema and build artifacts from Stage 1
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./dist

# Generate client in the production container (Standalone mode)
RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/main.js"]
