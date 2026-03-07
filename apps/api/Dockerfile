# Stage 1: Dependency base
FROM node:20-slim AS deps
WORKDIR /app

# Install system dependencies needed for Prisma/Bcrypt
RUN apt-get update && apt-get install -y openssl python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/package.json

# Install only production dependencies
# We use a trick to avoid installing the whole monorepo if possible, 
# but for simplicity in this setup we'll install and then prune.
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the app
RUN npm run build --workspace=api

# Prune dev dependencies
RUN npm prune --omit=dev --legacy-peer-deps

# Stage 3: Runner
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install runtime system dependencies
RUN apt-get update && apt-get install -y openssl postgresql-client && rm -rf /var/lib/apt/lists/*

# Copy only what is strictly necessary
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./package.json

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Migration and start
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
