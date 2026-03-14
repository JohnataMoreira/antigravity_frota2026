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

BUILD_DIR = "/tmp/FROTA_FINAL_FINAL"
TAG = f"frotaweb-stable-{int(time.time())}"

run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Dockerfile with Literal HEREDOC for Nginx
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

# Use Literal HEREDOC (quoted EOF) to prevent shell expansion of $ variables
RUN cat <<'EOF' > /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://api:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

RUN nginx -t

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
