FROM node:18

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

ENV DISCORD_TOKEN=${DISCORD_TOKEN}
ENV DB_USER=${DB_USER}
ENV DB_PASSWORD=${DB_PASSWORD}
ENV DB_HOST=${DB_HOST}
ENV DB_PORT=${DB_PORT}
ENV DB_NAME=${DB_NAME}
ENV ADMIN_CHANNEL_ID=${ADMIN_CHANNEL_ID}
ENV ADD_CHANNEL_ID=${ADD_CHANNEL_ID}
ENV MINECRAFT_SERVER_IP=${MINECRAFT_SERVER_IP}
ENV RCON_PORT=${RCON_PORT}
ENV RCON_PASSWORD=${RCON_PASSWORD}
ENV MINECRAFT_WORLD=${MINECRAFT_WORLD}

CMD ["node", "bot.js"]
