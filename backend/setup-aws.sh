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

    location / {
        proxy_pass http://localhost:5000;
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
    }
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