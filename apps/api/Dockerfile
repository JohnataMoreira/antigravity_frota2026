# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies required for build and Prisma
RUN apk add --no-cache openssl g++ make python3

# Copy monorepo configuration files
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/

# Install ALL dependencies (development + production) to build
RUN npm install --legacy-peer-deps

# Copy the rest of the application
COPY . .

# Generate Prisma Client specifically for the API
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the NestJS API application
RUN npm run build --workspace=apps/api

# After building, prune development dependencies to reduce node_modules size
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 2: Production (Runner)
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install ONLY the system dependencies needed at runtime (OpenSSL for Prisma, Postgres client for migrations)
RUN apk add --no-cache openssl postgresql-client

# Copy ONLY what is strictly necessary from the builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json

EXPOSE 3000

# API Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Deploy migrations and start the NestJS server
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/apps/api/src/main.js"]
