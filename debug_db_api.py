import subprocess
import json
import time

def run_ssh(cmd):
    full_cmd = ['ssh', 'root@159.69.198.77', cmd]
    try:
        return subprocess.check_output(full_cmd, stderr=subprocess.STDOUT).decode()
    except subprocess.CalledProcessError as e:
        return f"ERROR: {e.output.decode()}"

print("Checking User in DB...")
query = "SELECT count(*) FROM \\\"User\\\" WHERE email = 'admin@paraopeba.com.br';"
db_cmd = f"docker exec 009a06f07543 psql -U postgres -d postgres -c \"{query}\""
print(run_ssh(db_cmd))

print("\nFetching Full User Record for admin@paraopeba.com.br...")
query = "SELECT id, email, \\\"organizationId\\\", \\\"passwordHash\\\" FROM \\\"User\\\" WHERE email = 'admin@paraopeba.com.br';"
db_cmd = f"docker exec 009a06f07543 psql -U postgres -d postgres -c \"{query}\" --csv"
user_csv = run_ssh(db_cmd).strip()
print(user_csv)

if "," in user_csv:
    lines = user_csv.split("\n")
    if len(lines) > 1:
        headers = lines[0].split(",")
        values = lines[1].split(",")
        user_data = dict(zip(headers, values))
        
        pw_hash = user_data.get("passwordHash")
        org_id = user_data.get("organizationId")
        
        print(f"\nExtracted Hash: {pw_hash}")
        print(f"Extracted OrgId: {org_id}")
        
        print("\nTesting Bcrypt Compare inside test-api-3001...")
        bcrypt_test = f"""
const bcrypt = require('bcrypt');
bcrypt.compare('Frota@2026', '{pw_hash}').then(r => console.log('BCRYPT_RESULT:', r)).catch(e => console.log('BCRYPT_ERROR:', e.message));
"""
        print(run_ssh(f"echo \"{bcrypt_test}\" | docker exec -i test-api-3001 node -"))

print("\nApplying Missing Column tokenVersion to User table...")
# Using a hermetic query to avoid shell escape issues
sql = 'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tokenVersion" INTEGER NOT NULL DEFAULT 1;'
db_cmd = f"docker exec 009a06f07543 psql -U postgres -d postgres -c '{sql}'"
print(run_ssh(db_cmd))

print("\nVerifying Column existence...")
verify_sql = "SELECT column_name FROM information_schema.columns WHERE table_name='User' AND column_name='tokenVersion';"
db_cmd = f"docker exec 009a06f07543 psql -U postgres -d postgres -c \"{verify_sql}\""
print(run_ssh(db_cmd))

print("\nTesting Login again via diagnose.js...")
print(run_ssh("docker exec test-api-3001 node diagnose.js"))
