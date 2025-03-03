#!/bin/bash

echo "Verificando status do backend..."

# Verificar PM2
echo "Status do PM2:"
pm2 status

# Verificar Nginx
echo -e "\nStatus do Nginx:"
sudo systemctl status nginx

# Testar conexões
echo -e "\nTestando conexões:"
echo "1. Health check local:"
curl -s http://localhost:5000/health
echo -e "\n\n2. Health check através do Nginx:"
curl -s http://52.67.79.225/health

# Verificar logs
echo -e "\n\nÚltimas linhas dos logs:"
echo "1. PM2 logs:"
pm2 logs --lines 10
echo -e "\n2. Nginx error log:"
sudo tail -n 10 /var/log/nginx/barak-error.log 