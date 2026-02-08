# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY tsconfig.json ./
COPY apps/api/tsconfig.json ./apps/api/

# Install ALL dependencies
RUN npm install

# Copy source and build
COPY apps/api ./apps/api
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma
RUN npm run build -w api

# Stage 2: Production
# We treat the API as a standalone app here to avoid monorepo path hell
FROM node:20-alpine

WORKDIR /app

# Copy ONLY the API package file
COPY apps/api/package*.json ./

# Install production dependencies + prisma CLI (needed for the generator)
RUN npm install --omit=dev && npm install prisma@5.10.2

# Copy Prisma schema and build artifacts
COPY apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/dist ./dist

# Generate client in the production container
RUN npx prisma generate

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
# We know it's in dist/main.js because of our tsconfig change
CMD ["node", "dist/main.js"]
