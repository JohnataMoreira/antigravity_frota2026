import os
import subprocess
import time

def run(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(f"Stderr: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)
    return result.stdout

BUILD_DIR = "/tmp/frota2026-deploy-v6"
TAG = f"frotaweb-{int(time.time())}"

run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Minimal Dockerfile that generates nginx.conf internally
dockerfile_content = r'''# Stage 1: Build
FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npm run build --workspace=web

# Stage 2: Production
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Generate Nginx config INTERNALLY to avoid host-side corruption
RUN printf "server {\n\
    listen 80;\n\
    server_name _;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\n\
    location / {\n\
        try_files \$uri \$uri/ /index.html;\n\
    }\n\n\
    location /api/ {\n\
        proxy_pass http://api:3000/;\n\
        proxy_http_version 1.1;\n\
        proxy_set_header Upgrade \$http_upgrade;\n\
        proxy_set_header Connection 'upgrade';\n\
        proxy_set_header Host \$host;\n\
        proxy_set_header X-Real-IP \$remote_addr;\n\
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;\n\
        proxy_set_header X-Forwarded-Proto \$scheme;\n\
        proxy_cache_bypass \$http_upgrade;\n\
        proxy_connect_timeout 60s;\n\
        proxy_send_timeout 60s;\n\
        proxy_read_timeout 60s;\n\
    }\n\
}\n" > /etc/nginx/conf.d/default.conf && nginx -t

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
'''

with open('apps/web/Dockerfile', 'w') as f:
    f.write(dockerfile_content)

print("BUILDING DOCKER IMAGE...")
run(f"docker build --no-cache -t {TAG} -f apps/web/Dockerfile .")

print("UPDATING SERVICE...")
run(f"docker service update --force --image {TAG} frota2026-frotaweb-bmv9p5")

print(f"DEPLOY SUCCESSFUL with tag: {TAG}")
