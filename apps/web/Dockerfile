# Stage 1: Build
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Copy root configs
COPY package*.json ./
COPY tsconfig.json ./

# Copy Web workspace configs
COPY apps/web/package*.json ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/

# Install dependencies (Clean slate)
RUN npm install --legacy-peer-deps

# Copy Web code
COPY apps/web ./apps/web

# Build
RUN npm run build -w web

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Custom nginx config for SPA
RUN echo 'server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    try_files $uri /index.html; \
    } \
    }' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
