# Frota2026 - Windows Deploy Helper
# Executa os mesmos passos do deploy-ssh.sh de forma nativa no PowerShell

Write-Host "Frota2026 - Deploy Helper (Windows)"

# 1. Carregar variaveis do .env se existir
if (Test-Path .env) {
    Write-Host "Carregando .env..."
    foreach ($line in Get-Content .env) {
        if ($line -notmatch "^#" -and $line -like "*=*") {
            $name, $value = $line -split '=', 2
            [System.Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim())
        }
    }
}

# 2. Gerar segredos se faltarem
if (-not $env:POSTGRES_PASSWORD) {
    Write-Host "Gerando senha do banco..."
    $env:POSTGRES_PASSWORD = [Guid]::NewGuid().ToString("n").Substring(0, 24)
}

if (-not $env:JWT_SECRET) {
    Write-Host "Gerando JWT_SECRET..."
    $env:JWT_SECRET = [Guid]::NewGuid().ToString("n") + [Guid]::NewGuid().ToString("n")
}

# 3. Criar arquivo .env localmente para o Docker
$envContent = @"
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$($env:POSTGRES_PASSWORD)
POSTGRES_DB=frota2026
JWT_SECRET=$($env:JWT_SECRET)
STORAGE_BUCKET=frota-uploads
STORAGE_REGION=us-east-1
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=MinioSecure2024!
PORT=3000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:$($env:POSTGRES_PASSWORD)@postgres:5432/frota2026?schema=public
STORAGE_ENDPOINT=http://minio:9000
"@

$envContent | Out-File -FilePath .env -Encoding ascii

Write-Host "Env atualizado"

# 4. Docker Compose Build & Up
Write-Host "Building and Starting..."
docker compose -f docker-compose.vps.yml down
docker compose -f docker-compose.vps.yml build --no-cache
docker compose -f docker-compose.vps.yml up -d

Write-Host "Aguardando banco..."
Start-Sleep -Seconds 10

Write-Host "Prisma Push..."
docker compose -f docker-compose.vps.yml exec -T api npx prisma db push --accept-data-loss

Write-Host "Deploy Concluido com Sucesso!"
