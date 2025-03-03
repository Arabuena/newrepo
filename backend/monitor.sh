#!/bin/bash

# Verificar status do serviço
echo "Status do Nginx:"
sudo systemctl status nginx | grep active

echo "Status do PM2:"
pm2 list

echo "Status da Conexão MongoDB:"
curl -s http://localhost:5000/test-db | jq .

echo "Uso de memória:"
pm2 monit 