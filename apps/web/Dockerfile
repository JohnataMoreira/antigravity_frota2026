# Stage 1: Build
FROM node:20-slim AS builder
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy root configs
COPY package.json package-lock.json turbo.json ./

# Copy all apps (needed for workspace resolution)
COPY apps ./apps

# Install dependencies
RUN npm install --legacy-peer-deps

# Build web workspace
RUN npm run build --workspace=web --verbose

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx_prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
