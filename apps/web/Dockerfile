# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app

# Set memory limit
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Copy EVERYTHING (to ensure workspace parity with host)
COPY . .

# Install all dependencies
RUN npm install --legacy-peer-deps

# Build the web app
RUN npm run build --workspace=web --verbose

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx_prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
