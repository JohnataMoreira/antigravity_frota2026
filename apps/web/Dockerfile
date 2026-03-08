# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy workspace configs
COPY package.json package-lock.json turbo.json ./
COPY apps/web/package.json apps/web/package.json

# Install dependencies (selective)
RUN npm install --legacy-peer-deps

# Copy source
COPY apps/web apps/web

# Build
RUN npm run build --workspace=web

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx_prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
