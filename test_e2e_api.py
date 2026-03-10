import subprocess
import json
import time

def run_ssh(cmd):
    full_cmd = ['ssh', 'root@159.69.198.77', cmd]
    try:
        return subprocess.check_output(full_cmd, stderr=subprocess.STDOUT).decode()
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output.decode()}"

print("Obtaining PID of test-api-3001...")
pid = run_ssh("docker inspect -f '{{.State.Pid}}' test-api-3001").strip()
if "ERROR" in pid or not pid:
    print(f"Failed to get PID: {pid}")
    exit(1)

print(f"PID: {pid}")

# Login Test
print("\n--- LOGIN TEST ---")
login_data = json.dumps({'email': 'admin@paraopeba.com.br', 'password': 'Frota@2026'})
login_cmd = f"nsenter -t {pid} -n curl -s -v -X POST http://localhost:3001/api/v1/auth/login -H 'Content-Type: application/json' -d '{login_data}'"
print(run_ssh(login_cmd))

# Register Test
print("\n--- REGISTER TEST ---")
email = f"test-user-{int(time.time())}@example.com"
reg_data = json.dumps({
    'name': 'Test User',
    'email': email,
    'password': 'Password@123',
    'organizationName': 'Test Org'
})
reg_cmd = f"nsenter -t {pid} -n curl -s -v -X POST http://localhost:3001/api/v1/users/register -H 'Content-Type: application/json' -d '{reg_data}'"
print(run_ssh(reg_cmd))
