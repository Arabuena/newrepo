FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Remove as variáveis de ambiente hardcoded
RUN rm -f .env .env.local

EXPOSE 3000

CMD ["npm", "start"] 