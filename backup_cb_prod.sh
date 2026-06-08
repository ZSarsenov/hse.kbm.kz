#!/bin/bash
# Ежедневный бэкап БД cb_kz_prod
# Добавить в crontab: 0 2 * * * /home/sadmin/backups/backup_cb_prod.sh

BACKUP_DIR="/home/sadmin/backups"
DB_NAME="cb_kz_prod"
RETENTION_DAYS=30

mkdir -p "$BACKUP_DIR"

BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_$(date +%Y%m%d_%H%M%S).sql.gz"

echo "$(date): Starting backup of $DB_NAME..."
sudo -u postgres pg_dump "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "$(date): Backup saved to $BACKUP_FILE"
    # Удаление бэкапов старше 30 дней
    find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete
    echo "$(date): Old backups (>${RETENTION_DAYS} days) cleaned up."
else
    echo "$(date): ERROR: Backup failed!"
    exit 1
fi
