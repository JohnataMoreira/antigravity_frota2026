import os
import subprocess
import time

def run(cmd, is_shell=True):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=is_shell, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(f"Stderr: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)
    return result.stdout

BUILD_DIR = "/tmp/FROTA_FINAL_SAFE"
TAG = f"frotaweb-final-{int(time.time())}"

run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Build ON HOST (already proven to work)
print("Building and installing on host...")
run("npm install --legacy-peer-deps")
run("npm run build --workspace=web")

# Create nginx.conf ON HOST using binary write (pure LF)
nginx_content = """server {
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
"""
with open('apps/web/nginx.conf', 'wb') as f:
    f.write(nginx_content.encode('utf8'))

# Simplified Dockerfile
dockerfile_content = """FROM nginx:alpine
# Copy pre-built dist
COPY apps/web/dist /usr/share/nginx/html
# Copy config
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
RUN nginx -t
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""
with open('apps/web/Dockerfile.safe', 'w') as f:
    f.write(dockerfile_content)

print("BUILDING DOCKER IMAGE...")
run(["docker", "build", "-t", TAG, "-f", "apps/web/Dockerfile.safe", "."], is_shell=False)

print("UPDATING SERVICE...")
run(["docker", "service", "update", "--force", "--image", TAG, "frota2026-frotaweb-bmv9p5"], is_shell=False)

print(f"DEPLOY SUCCESSFUL with tag: {TAG}")
