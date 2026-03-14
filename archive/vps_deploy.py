import os
import subprocess

def run(cmd):
    print(f"Running: {cmd}")
    subprocess.run(cmd, shell=True, check=True)

# Build directory
BUILD_DIR = "/tmp/frota2026-deploy-final"

# Clean and clone
run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Create nginx.conf
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
with open('apps/web/nginx.conf', 'w') as f:
    f.write(nginx_content)

# Docker build and service update
run("docker build --no-cache -t frota2026-frotaweb-bmv9p5:latest -f apps/web/Dockerfile .")
run("docker service update --force --image frota2026-frotaweb-bmv9p5:latest frota2026-frotaweb-bmv9p5")

print("DEPLOY SUCCESSFUL")
