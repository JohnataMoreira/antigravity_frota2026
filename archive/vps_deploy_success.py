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

BUILD_DIR = "/tmp/FROTA_SUCCESS"
TAG = f"frotaweb-prod-{int(time.time())}"

run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Build ON HOST
print("Building Frontend on VPS host...")
run("npm install --legacy-peer-deps")
run("npm run build --workspace=web")

# Create nginx.conf (Binary LF)
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

# Final production Dockerfile (NO nginx -t during build)
dockerfile_content = """FROM nginx:alpine
COPY apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
"""
with open('apps/web/Dockerfile.prod', 'w') as f:
    f.write(dockerfile_content)

print("PARKAGING DOCKER IMAGE...")
run(f"docker build -t {TAG} -f apps/web/Dockerfile.prod .")

print("UPDATING SWARM SERVICE...")
run(f"docker service update --force --image {TAG} frota2026-frotaweb-bmv9p5")

print(f"DEPLOY SUCCESSFUL! Image tag: {TAG}")
