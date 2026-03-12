# Deep Clean script for Frota2026 Mobile
# This script resets node_modules, clears Metro and Expo caches, and restores a clean environment.

Write-Host "🚀 Iniciando Deep Clean no Frota2026 Mobile..." -ForegroundColor Cyan

# 1. Stop existing Expo processes (optional, might be aggressive)
# Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process

# 2. Cleanup folders
Write-Host "🧹 Removendo pastas temporárias e node_modules..." -ForegroundColor Yellow
Remove-Item -Path "node_modules", ".expo", "dist", "web-build", "android/build", "ios/build" -Recurse -Force -ErrorAction SilentlyContinue

# 3. Clear Metro Cache
Write-Host "🌀 Limpando cache do Metro..." -ForegroundColor Yellow
$tempPath = [System.IO.Path]::GetTempPath()
Remove-Item -Path "$tempPath/metro-*" -Recurse -Force -ErrorAction SilentlyContinue

# 4. Watchman reset (if available)
if (Get-Command "watchman" -ErrorAction SilentlyContinue) {
    Write-Host "👀 Resetando Watchman..." -ForegroundColor Yellow
    watchman watch-del-all
}

# 5. Reinstall dependencies
Write-Host "📦 Reinstalando dependências..." -ForegroundColor Yellow
npm install

Write-Host "✅ Ambiente limpo e pronto para o Expo! Rode 'npx expo start -c' para iniciar." -ForegroundColor Green
