#!/bin/bash

echo "Iniciando deploy do Barak Backend..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "Node.js não encontrado. Execute setup-aws.sh primeiro."
    exit 1
fi

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "PM2 não encontrado. Execute setup-aws.sh primeiro."
    exit 1
fi

# Criar diretório de logs
mkdir -p logs

echo "Parando aplicação anterior..."
pm2 stop all
pm2 delete all
pm2 save

echo "Limpando instalação anterior..."
rm -rf node_modules

echo "Instalando dependências..."
npm install --omit=dev

echo "Verificando se a porta 5000 está em uso..."
sudo lsof -i :5000

echo "Iniciando aplicação com PM2..."
NODE_ENV=production pm2 start ecosystem.config.js --env production

echo "Salvando configuração do PM2..."
pm2 save

echo "Configurando PM2 para iniciar no boot..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Verificar status e mostrar logs
echo "Status da aplicação:"
pm2 status

echo "Últimas linhas do log:"
pm2 logs barak-backend --lines 20 || echo "Aguardando logs..."

echo "Deploy concluído! Para ver os logs em tempo real, execute: pm2 logs barak-backend" 