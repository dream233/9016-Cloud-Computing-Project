FROM node:18

WORKDIR /app

# 安装 curl
RUN apt-get update && apt-get install -y curl

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]