import os
import subprocess
import time
import base64

def run(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error executing command: {cmd}")
        print(f"Stderr: {result.stderr}")
        raise subprocess.CalledProcessError(result.returncode, cmd)
    return result.stdout

BUILD_DIR = "/tmp/FROTA_GOD_MODE"
TAG = f"frotaweb-prod-{int(time.time())}"

run(f"rm -rf {BUILD_DIR}")
run(f"git clone https://github.com/JohnataMoreira/antigravity_frota2026.git {BUILD_DIR}")
os.chdir(BUILD_DIR)
run("git checkout main")

# Explicit LF only Nginx config
nginx_content = "server {\n" \
                "    listen 80;\n" \
                "    server_name _;\n" \
                "    root /usr/share/nginx/html;\n" \
                "    index index.html;\n" \
                "\n" \
                "    location / {\n" \
                "        try_files $uri $uri/ /index.html;\n" \
                "    }\n" \
                "\n" \
                "    location /api/ {\n" \
                "        proxy_pass http://api:3000/;\n" \
                "        proxy_http_version 1.1;\n" \
                "        proxy_set_header Upgrade $http_upgrade;\n" \
                "        proxy_set_header Connection 'upgrade';\n" \
                "        proxy_set_header Host $host;\n" \
                "        proxy_set_header X-Real-IP $remote_addr;\n" \
                "        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\n" \
                "        proxy_set_header X-Forwarded-Proto $scheme;\n" \
                "        proxy_cache_bypass $http_upgrade;\n" \
                "        \n" \
                "        proxy_connect_timeout 60s;\n" \
                "        proxy_send_timeout 60s;\n" \
                "        proxy_read_timeout 60s;\n" \
                "    }\n" \
                "}\n"

b64_nginx = base64.b64encode(nginx_content.encode('utf8')).decode('ascii')

# Write via Base64 to guarantee NO corruption
with open('write_nginx.sh', 'w') as f:
    f.write(f"echo {b64_nginx} | base64 -d > apps/web/nginx.conf\n")

run("bash write_nginx.sh")
run("rm write_nginx.sh")

print("NGINX.CONF WRITTEN VIA BASE64")
run("od -c apps/web/nginx.conf")

# Build ON HOST
print("Building Frontend on VPS host...")
run("npm install --legacy-peer-deps")
run("npm run build --workspace=web")

# Final production Dockerfile
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
