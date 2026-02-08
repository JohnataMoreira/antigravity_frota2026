# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root configurations
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma
COPY tsconfig.json ./
COPY apps/api/tsconfig.json ./apps/api/

# Install dependencies (incl. devDeps)
RUN npm install

# Copy source and build
COPY apps/api ./apps/api
RUN npm run build -w api

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
# Prisma needs to generate the client, so keeping it in dependencies was correct
RUN npm install --production

# Copy Prisma schema and generate client in the production stage
COPY apps/api/prisma ./apps/api/prisma
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Copy only the compiled JS from builder
COPY --from=builder /app/apps/api/dist ./dist

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
CMD ["node", "dist/main.js"]
