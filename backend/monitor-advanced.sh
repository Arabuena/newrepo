#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== Status do Sistema ===${NC}"

# Verificar CPU e Memória
echo -e "\n${GREEN}CPU e Memória:${NC}"
free -h
echo -e "\nCPU Load:"
uptime

# Status do PM2
echo -e "\n${GREEN}Status do PM2:${NC}"
pm2 jlist

# Verificar logs de erro
echo -e "\n${GREEN}Últimos erros:${NC}"
tail -n 5 logs/err.log

# Status do MongoDB
echo -e "\n${GREEN}Status do MongoDB:${NC}"
curl -s http://localhost:5000/test-db

# Verificar espaço em disco
echo -e "\n${GREEN}Espaço em Disco:${NC}"
df -h /

# Verificar portas em uso
echo -e "\n${GREEN}Portas em uso:${NC}"
sudo netstat -tulpn | grep -E ':80|:5000'

# Verificar logs do Nginx
echo -e "\n${GREEN}Últimos logs do Nginx:${NC}"
tail -n 5 /var/log/nginx/error.log 