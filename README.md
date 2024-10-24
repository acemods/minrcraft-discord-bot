# Minecraft Location Bot

## What This Application Does

This Discord bot helps manage and track locations in a Minecraft world. Here's what it does in plain English:

1. Users can add new locations by typing `!add` in a Discord channel or DM.
2. The bot then asks the user for details about the location, including:
   - Minecraft username
   - Location name
   - X coordinate
   - Z coordinate
3. Admins can review these submitted locations in a special admin channel.
4. Admins can approve or deny locations using commands.
5. When a location is approved, the bot adds a marker to the Minecraft server's Dynmap.
6. Admins can also remove locations, list all locations, and check marker IDs.
7. The bot keeps a log of all changes made to locations.

## Setup Instructions

### Requirements

- Node.js 18 or higher
- PostgreSQL 13 or higher
- A Discord bot token
- A Minecraft server with Dynmap and RCON enabled

### Step-by-Step Setup

1. Clone the repository:
   ```
   git clone https://github.com/acemods/minecraft-location-bot.git
   cd minecraft-location-bot
   ```

2. Install the required packages:
   ```
   npm install
   ```

3. Create a file named `.env` in the main folder and add the following information:
   ```
   DISCORD_TOKEN=your_discord_bot_token_here
   DB_USER=minecraft_bot
   DB_PASSWORD=your_database_password_here
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=minecraft_locations
   ADMIN_CHANNEL_ID=your_admin_channel_id_here
   ADD_CHANNEL_ID=your_add_channel_id_here
   MINECRAFT_SERVER_IP=your_minecraft_server_ip_here
   RCON_PORT=25575
   RCON_PASSWORD=your_rcon_password_here
   MINECRAFT_WORLD=your_minecraft_world_name_here
   ```
   Replace the "your_..." parts with your actual information.

4. Set up the database:
   ```
   node init_db.js
   ```

5. Start the bot:
   ```
   node bot.js
   ```

### Docker Setup

If you prefer to use Docker, follow these steps:

1. Install Docker Desktop for Mac:
   - Download Docker Desktop from the [official Docker website](https://www.docker.com/products/docker-desktop).
   - Install and run Docker Desktop.

2. Ensure your Dockerfile is up to date:
   ```Dockerfile
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
   ```

3. Update your docker-compose.yml file:
   ```yaml
   version: '3.8'

   services:
     bot:
       build: .
       env_file: .env
       depends_on:
         - db
       restart: unless-stopped

     db:
       image: postgres:13
       environment:
         - POSTGRES_USER=${DB_USER}
         - POSTGRES_PASSWORD=${DB_PASSWORD}
         - POSTGRES_DB=${DB_NAME}
       volumes:
         - postgres_data:/var/lib/postgresql/data
       restart: unless-stopped

   volumes:
     postgres_data:
   ```

4. Ensure your .env file is up to date with all required environment variables.

5. Open Terminal and navigate to your project directory.

6. Build and run the Docker containers:
   ```
   docker-compose up --build
   ```

   This command will build the Docker image for your bot and start both the bot and database containers.

7. To stop the containers, press Ctrl+C in the terminal where docker-compose is running, or run:
   ```
   docker-compose down
   ```

8. If you need to rebuild the image after making changes:
   ```
   docker-compose up --build
   ```

9. To run the containers in detached mode (in the background):
   ```
   docker-compose up -d
   ```

10. To view logs when running in detached mode:
    ```
    docker-compose logs -f
    ```

11. To stop and remove the containers, networks, and volumes:
    ```
    docker-compose down -v
    ```

Remember to never commit your .env file to version control. It's already in your .gitignore file, which is good.

#### Troubleshooting

- If you encounter issues with permissions or file access, ensure that Docker has the necessary permissions to access your project directory.
- If the database connection fails, double-check that the DB_HOST in your .env file is set to 'db' (the name of the database service in docker-compose.yml).
- For any other issues, check the Docker logs using `docker-compose logs -f` to get more information about the error.

#### Additional Docker Commands

- To list running containers:
  ```
  docker ps
  ```

- To enter a running container (e.g., the
   ```
   docker exec -it minecraft-discord-bot_bot_1 /bin/bash
   ```

- To view Docker networks:
  ```
  docker network ls
  ```

## Commands

- `!add`: Start adding a new location (works in DM or designated channel)
- `!pending`: List pending locations (admin only)
- `!approve <location_id>`: Approve a location (admin only)
- `!deny <location_id>`: Deny a location (admin only)
- `!remove <location_id>`: Remove a location (admin only)
- `!listall`: List all locations (admin only)
- `!checkmarker <location_id>`: Check a location's marker ID (admin only)
- `!testrcon`: Test the connection to the Minecraft server (admin only)

## Contributing

Feel free to submit pull requests or open issues if you have suggestions for improvements.

## License

This project is licensed under the MIT License.
