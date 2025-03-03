#!/bin/bash

# Instalar dependências
npm ci --production

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js --env production

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup

# Verificar status
pm2 status 