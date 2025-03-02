#!/bin/bash

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Instalar Nginx e Certbot
sudo apt install -y nginx certbot python3-certbot-nginx

# Remover configuração antiga do Nginx
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-available/barak-backend
sudo rm -f /etc/nginx/sites-enabled/barak-backend

# Configurar Nginx inicialmente para HTTP
sudo tee /etc/nginx/sites-available/barak-backend << EOF
server {
    listen 80;
    server_name 52.67.79.225;

    # Rota para health check
    location = /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Rota para API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # CORS headers
        add_header 'Access-Control-Allow-Origin' 'https://newrepo-woad-nine.vercel.app' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        
        if (\$request_method = 'OPTIONS') {
            add_header 'Access-Control-Allow-Origin' 'https://newrepo-woad-nine.vercel.app' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
            add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization, Accept' always;
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Content-Type' 'text/plain charset=UTF-8';
            add_header 'Content-Length' 0;
            return 204;
        }
    }

    # Rota padrão
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    # Logs
    error_log /var/log/nginx/barak-error.log debug;
    access_log /var/log/nginx/barak-access.log;
}
EOF

# Criar link simbólico e verificar configuração
sudo ln -s /etc/nginx/sites-available/barak-backend /etc/nginx/sites-enabled/
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Configurar firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Obter e configurar SSL com Certbot
sudo certbot --nginx -d 52.67.79.225 --non-interactive --agree-tos --email ara100limite@gmail.com

# Verificar status final
sudo systemctl status nginx
sudo certbot certificates 
sudo certbot certificates 