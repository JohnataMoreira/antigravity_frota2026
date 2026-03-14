import os
import subprocess
import time

def run(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(f"Stdout: {result.stdout}")
        print(f"Stderr: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)
    return result.stdout

# Build directory
BUILD_DIR = "/tmp/frota2026-deploy-v2"
TAG = f"frotaweb-{int(time.time())}"

# Clean and clone
run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Create nginx.conf (using binary write to ensure LF)
nginx_content = r'''server {
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
'''
# Normalize newlines to LF and write binary
with open('apps/web/nginx.conf', 'wb') as f:
    f.write(nginx_content.replace('\r\n', '\n').encode('utf8'))

# Verify file locally with xxd or od
print("Verifying nginx.conf content on VPS:")
run("od -c apps/web/nginx.conf")

# Docker build
run(f"docker build --no-cache -t {TAG} -f apps/web/Dockerfile .")

# Update service
run(f"docker service update --force --image {TAG} frota2026-frotaweb-bmv9p5")

print(f"DEPLOY SUCCESSFUL with tag: {TAG}")
