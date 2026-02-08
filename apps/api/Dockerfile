# Stage 1: Build & Prepare Production State
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy the ENTIRE monorepo (safest for workspaces)
COPY . .

# Install ALL dependencies (including devDeps for build)
RUN npm install --legacy-peer-deps

# Generate Prisma Client (uses root node_modules/@prisma/client)
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

# Build the API
RUN npm run build -w api

# Prune to production only
RUN npm prune --production --legacy-peer-deps

# Stage 2: Final Production Image
FROM node:20-bookworm-slim

WORKDIR /app

# Install OpenSSL (Runtime requirement for Prisma)
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy the PREPARED production node_modules from builder
# This includes the correctly generated Prisma Client and all dependencies
COPY --from=builder /app/node_modules ./node_modules

# Copy the BUILT code (remembering our tsconfig change to local dist)
COPY --from=builder /app/apps/api/dist ./dist

# Copy the prisma folder (needed for migrations in deploy-ssh.sh)
COPY --from=builder /app/apps/api/prisma ./prisma

# Final safety check: verifying main.js exists
RUN if [ ! -f dist/main.js ]; then echo "CRITICAL: dist/main.js not found!" && exit 1; fi

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["node", "dist/main.js"]
