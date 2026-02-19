# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

COPY . .

RUN npm install --legacy-peer-deps

# Build the Web app
RUN npm run build --workspace=web

# Generate version.json directly after build (no plugin needed)
RUN echo "{\"version\":\"$(date +%s)\",\"buildTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}" \
    > /app/apps/web/dist/version.json

# Stage 2: Production
FROM nginx:alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
