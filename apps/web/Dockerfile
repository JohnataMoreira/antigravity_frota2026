# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# [11/10 STRATEGY] Copy EVERYTHING
COPY . .

# [11/10 STRATEGY] Sync all dependencies at ROOT
RUN npm install --legacy-peer-deps

# Build the Web app
RUN npm run build --workspace=web

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Copy custom nginx config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
