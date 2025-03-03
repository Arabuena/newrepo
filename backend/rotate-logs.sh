#!/bin/bash

# Diretório de logs
LOG_DIR="logs"
MAX_LOGS=5

# Criar diretório de backup
BACKUP_DIR="$LOG_DIR/backup"
mkdir -p $BACKUP_DIR

# Rotacionar logs
timestamp=$(date +%Y%m%d_%H%M%S)

# Rotacionar logs de erro
if [ -f "$LOG_DIR/err.log" ]; then
    mv "$LOG_DIR/err.log" "$BACKUP_DIR/err_$timestamp.log"
fi

# Rotacionar logs de saída
if [ -f "$LOG_DIR/out.log" ]; then
    mv "$LOG_DIR/out.log" "$BACKUP_DIR/out_$timestamp.log"
fi

# Manter apenas os últimos 5 arquivos de backup
cd $BACKUP_DIR
ls -t *.log | tail -n +$((MAX_LOGS + 1)) | xargs -r rm

# Reiniciar PM2 para criar novos arquivos de log
pm2 reload barak-backend 