# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./
# Copy API package and prisma
COPY apps/api/package*.json ./apps/api/
COPY apps/api/prisma ./apps/api/prisma

# Install ALL dependencies (including devDeps for build)
RUN npm install

# Copy source code and config
COPY apps/api ./apps/api
COPY tsconfig.json ./

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
RUN npm install --production

# Copy built files and Prisma
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy generated Prisma client and engines from the correct locations
# If generated inside apps/api/node_modules
RUN if [ -d /app/apps/api/node_modules/@prisma ]; then \
    cp -r /app/apps/api/node_modules/@prisma ./node_modules/; \
    fi && \
    if [ -d /app/apps/api/node_modules/.prisma ]; then \
    cp -r /app/apps/api/node_modules/.prisma ./node_modules/; \
    fi

# Also check root node_modules just in case of hoisting
RUN if [ -d /app/node_modules/@prisma ]; then \
    cp -r /app/node_modules/@prisma ./node_modules/; \
    fi && \
    if [ -d /app/node_modules/.prisma ]; then \
    cp -r /app/node_modules/.prisma ./node_modules/; \
    fi

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start application
# Flexible entrypoint to handle potential nesting
CMD ["sh", "-c", "if [ -f dist/src/main.js ]; then node dist/src/main.js; else node dist/main.js; fi"]
