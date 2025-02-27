# Primeiro estágio - Builder
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Remove as variáveis de ambiente hardcoded
RUN rm -f .env .env.local

# Criar build de produção
RUN npm run build

# Segundo estágio - Nginx
FROM nginx:alpine

# Copiar build para nginx
COPY --from=builder /app/build /usr/share/nginx/html

# Copiar configuração do nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 