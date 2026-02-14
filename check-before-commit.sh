#!/bin/bash
# check-before-commit.sh

echo "🔍 Verificando código..."

echo "1. TypeScript Backend..."
cd apps/api && npm run type-check || exit 1

echo "2. Build Backend..."
npm run build || exit 1

echo "3. TypeScript Frontend..."
cd ../web && npm run type-check || exit 1

echo "4. Build Frontend..."
npm run build || exit 1

echo "✅ Tudo OK! Pode commitar."
