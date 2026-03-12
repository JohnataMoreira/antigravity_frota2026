# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/package.json

# Install dependencies for the web workspace specifically
# This ensures binaries are linked correctly
RUN npm install --workspace=web --legacy-peer-deps

# Copy web source code
COPY apps/web ./apps/web

# Build the web app from the workspace directory (skipping tsc for debugging)
RUN cd apps/web && npx vite build --verbose

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx_prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
