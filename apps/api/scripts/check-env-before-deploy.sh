#!/bin/bash
# scripts/check-env-before-deploy.sh
# Rode este script ANTES de qualquer push para produção.
# Se ele falhar, NÃO faça deploy.

echo "🔍 Verificando variáveis de ambiente no servidor..."

# Variáveis obrigatórias — adicione aqui quando criar novas no código
REQUIRED_VARS=(
  "JWT_ACCESS_SECRET"
  "JWT_REFRESH_SECRET"
  "COOKIE_SECRET"
  "DATABASE_URL"
  "REDIS_URL"
)

MISSING=()

# Nota: Este script assume que você está em um ambiente onde pode ler as envs 
# ou que ele serve como um template para o seu CI/CD no Dokploy/GitHub Actions.
for VAR in "${REQUIRED_VARS[@]}"; do
  # Verifica se a variável existe e não está vazia
  if [ -z "${!VAR}" ]; then
    MISSING+=("$VAR")
  fi
done

if [ ${#MISSING[@]} -ne 0 ]; then
  echo ""
  echo "═══════════════════════════════════════════════"
  echo "  ❌ DEPLOY BLOQUEADO — Variáveis ausentes:"
  echo "═══════════════════════════════════════════════"
  for VAR in "${MISSING[@]}"; do
    echo "  • $VAR"
  done
  echo ""
  echo "  Adicione no Dokploy antes de continuar."
  echo "  Para gerar: openssl rand -base64 48"
  echo "═══════════════════════════════════════════════"
  exit 1
fi

echo "✅ Todas as variáveis estão presentes. Deploy pode prosseguir."
