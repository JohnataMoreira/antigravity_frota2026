# Stage 1: Build
FROM node:18 AS builder
WORKDIR /app

# Copy ONLY web package.json (Isolated Build)
COPY apps/web/package.json ./

# Install dependencies for ONLY this package
# This bypasses all workspace-related hoisting issues
RUN npm install --legacy-peer-deps

# Copy web source code
COPY apps/web ./

# Build the web app
RUN npx vite build --verbose

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx_prod.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
