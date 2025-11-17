#!/bin/bash

# PMIS Tetouan - Database Backup Script
# Creates a timestamped backup of the MySQL database

set -e

BACKUP_DIR="/backups/pmis_tetouan"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/pmis_tetouan_$TIMESTAMP.sql.gz"

echo "PMIS Tetouan - Database Backup"
echo "=============================="
echo ""

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "[1/3] Creating database backup..."
mysqldump -u root -p --single-transaction --routines --triggers pmis_tetouan | gzip > $BACKUP_FILE

echo "[2/3] Backup created: $BACKUP_FILE"

# Calculate file size
FILE_SIZE=$(du -h $BACKUP_FILE | cut -f1)
echo "File size: $FILE_SIZE"

# Keep only last 30 days of backups
echo "[3/3] Cleaning old backups (keeping last 30 days)..."
find $BACKUP_DIR -name "pmis_tetouan_*.sql.gz" -type f -mtime +30 -delete

echo ""
echo "✓ Backup completed successfully"
echo "Backup location: $BACKUP_FILE"
