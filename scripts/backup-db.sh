#!/bin/bash
# c:/Projetos/Antigravity/apps/Frota2026/scripts/backup-db.sh

# Directory for backups
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
FILE_NAME="frota2026-backup-$TIMESTAMP.sql"

echo " iniciando backup do banco de dados Frota2026..."

# Export from docker container
# Replace antigravity_frota2026-postgres-1 if container name differs
docker exec antigravity_frota2026-postgres-1 pg_dump -U postgres frota2026 > "$BACKUP_DIR/$FILE_NAME"

if [ $? -eq 0 ]; then
  echo "✅ Backup concluído com sucesso: $BACKUP_DIR/$FILE_NAME"
  # Keep only last 7 days of backups
  find $BACKUP_DIR -name "*.sql" -type f -mtime +7 -delete
else
  echo "❌ Erro ao realizar backup!"
  exit 1
fi
