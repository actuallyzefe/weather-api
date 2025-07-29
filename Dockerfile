FROM node:18-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*


COPY package*.json ./


RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3000


CMD ["npm", "run", "start:dev"] 