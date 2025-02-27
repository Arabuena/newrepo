FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Instalar apenas dependências de produção
RUN npm ci --only=production

COPY . .

# Remover arquivos sensíveis
RUN rm -f .env .env.local

EXPOSE 3001

# Adicionar healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
  CMD node healthcheck.js || exit 1

CMD ["npm", "start"] 