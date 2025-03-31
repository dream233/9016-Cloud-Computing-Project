FROM node:18

WORKDIR /app

# 安装 curl、telnet 和 mysql-client
RUN apt-get update && apt-get install -y curl telnet default-mysql-client

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "app.js"]