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

### Docker Setup (Optional)

If you prefer to use Docker:

1. Make sure Docker and Docker Compose are installed on your system.

2. Create the Dockerfile and docker-compose.yml files as shown in the codebase:

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
