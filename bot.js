const { Client, GatewayIntentBits, MessageCollector } = require('discord.js');
const { Rcon } = require('rcon-client');
const db = require('./db');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once('ready', () => {
  console.log('Bot is ready!');
});

const askQuestion = async (user, question) => {
  await user.send(question);
  const filter = (m) => m.author.id === user.id;
  const collector = new MessageCollector(user.dmChannel, { filter, max: 1, time: 60000 });
  
  return new Promise((resolve) => {
    collector.on('collect', (m) => resolve(m.content));
    collector.on('end', (collected) => {
      if (collected.size === 0) resolve(null);
    });
  });
};

const submitLocation = async (user) => {
  const minecraftUsername = await askQuestion(user, "What's your Minecraft username?");
  if (!minecraftUsername) return user.send("Submission cancelled due to timeout.");

  const locationName = await askQuestion(user, "What's the name of this location?");
  if (!locationName) return user.send("Submission cancelled due to timeout.");

  const xCoord = await askQuestion(user, "What's the X coordinate?");
  if (!xCoord) return user.send("Submission cancelled due to timeout.");

  const zCoord = await askQuestion(user, "What's the Z coordinate?");
  if (!zCoord) return user.send("Submission cancelled due to timeout.");

  try {
    const result = await db.query(
      'INSERT INTO locations (minecraft_username, location_name, x_coord, z_coord, discord_user_id, discord_username) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [minecraftUsername, locationName, parseInt(xCoord), parseInt(zCoord), user.id, user.username]
    );
    
    user.send(`Thank you! Your location "${locationName}" has been submitted for approval.`);
    
    // Notify admins (you'll need to set up an admin channel)
    const adminChannel = await client.channels.fetch(process.env.ADMIN_CHANNEL_ID);
    adminChannel.send(`New location submitted:\nDiscord User: ${user.username}\nMinecraft User: ${minecraftUsername}\nLocation: ${locationName}\nCoordinates: ${xCoord}, ${zCoord}\nID: ${result.rows[0].id}`);
  } catch (err) {
    console.error('Error adding location to database:', err);
    user.send("There was an error submitting your location. Please try again later.");
  }
};

const listPendingLocations = async (message) => {
  try {
    const result = await db.query('SELECT * FROM locations WHERE status = $1', ['pending']);
    if (result.rows.length === 0) {
      message.channel.send('No pending locations.');
    } else {
      const locationList = result.rows.map(loc => 
        `ID: ${loc.id} | Discord User: ${loc.discord_username} | Minecraft User: ${loc.minecraft_username} | Location: ${loc.location_name} | Coords: ${loc.x_coord}, ${loc.z_coord}`
      ).join('\n');
      message.channel.send(`Pending locations:\n${locationList}`);
    }
  } catch (err) {
    console.error('Error fetching pending locations:', err);
    message.channel.send('Error fetching pending locations.');
  }
};

// Add this function to handle RCON commands
const executeRconCommand = async (command) => {
  const rcon = new Rcon({
    host: process.env.MINECRAFT_SERVER_IP,
    port: parseInt(process.env.RCON_PORT),
    password: process.env.RCON_PASSWORD
  });

  try {
    await rcon.connect();
    const response = await rcon.send(command);
    console.log('RCON response:', response);
    await rcon.end();
    return response;
  } catch (error) {
    console.error('RCON error:', error);
    throw error;
  }
};

// Update the approveLocation function
const approveLocation = async (message, locationId) => {
  try {
    const result = await db.query(
      'UPDATE locations SET status = $1, approved_by = $2, modified_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      ['approved', message.author.username, locationId]
    );
    if (result.rows.length === 0) {
      message.channel.send(`No location found with ID ${locationId}`);
    } else {
      const loc = result.rows[0];
      message.channel.send(`Location ${loc.location_name} (ID: ${loc.id}) has been approved.`);
      
      // Add the marker to Dynmap using RCON
      const dynmapCommand = `dmarker add "${loc.location_name}" icon:star x:${loc.x_coord} y:64 z:${loc.z_coord} world:${process.env.MINECRAFT_WORLD}`;
      console.log('Dynmap command:', dynmapCommand);
      try {
        const response = await executeRconCommand(dynmapCommand);
        console.log('Dynmap command response:', response);
        
        // Extract marker ID from the response
        const markerIdMatch = response.match(/id:'(marker_\d+)'/);
        if (markerIdMatch) {
          const markerId = markerIdMatch[1];
          
          // Save marker ID to database
          const updateResult = await db.query(
            'UPDATE locations SET marker_id = $1 WHERE id = $2 RETURNING *',
            [markerId, locationId]
          );
          
          if (updateResult.rows.length > 0) {
            console.log(`Marker ID ${markerId} saved for location ${locationId}`);
            message.channel.send(`Marker added to Dynmap for ${loc.location_name}. Marker ID: ${markerId}`);
            
            // Send DM to the user who submitted the location
            const user = await client.users.fetch(loc.discord_user_id);
            if (user) {
              await user.send(`Your location "${loc.location_name}" has been approved and added to the map!`);
            }
          } else {
            console.error(`Failed to save marker ID ${markerId} for location ${locationId}`);
            message.channel.send(`Marker added to Dynmap for ${loc.location_name}, but failed to save Marker ID in database.`);
          }
        } else {
          console.error(`Failed to extract marker ID from response: ${response}`);
          message.channel.send(`Marker added to Dynmap for ${loc.location_name}, but couldn't extract marker ID.`);
        }
      } catch (rconError) {
        console.error('Dynmap command error:', rconError);
        message.channel.send(`Error adding marker to Dynmap: ${rconError.message}`);
      }
    }
  } catch (err) {
    console.error('Error approving location:', err);
    message.channel.send('Error approving location.');
  }
};

const denyLocation = async (message, locationId) => {
  try {
    const result = await db.query(
      'UPDATE locations SET status = $1, approved_by = $2, modified_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      ['denied', message.author.username, locationId]
    );
    if (result.rows.length === 0) {
      message.channel.send(`No location found with ID ${locationId}`);
    } else {
      const loc = result.rows[0];
      message.channel.send(`Location ${loc.location_name} (ID: ${loc.id}) has been denied.`);
    }
  } catch (err) {
    console.error('Error denying location:', err);
    message.channel.send('Error denying location.');
  }
};

// Add this function
const testRcon = async (message) => {
  try {
    const response = await executeRconCommand('list');
    message.channel.send(`RCON test successful. Response: ${response}`);
  } catch (error) {
    message.channel.send(`RCON test failed: ${error.message}`);
  }
};

const removeLocation = async (message, locationId) => {
  try {
    // Fetch the location from the database
    const result = await db.query(
      'SELECT * FROM locations WHERE id = $1 AND removed = FALSE',
      [locationId]
    );

    if (result.rows.length === 0) {
      return message.channel.send(`No active location found with ID ${locationId}`);
    }

    const location = result.rows[0];

    if (!location.marker_id) {
      return message.channel.send(`Location ${location.location_name} (ID: ${location.id}) doesn't have a marker ID. It may not have been approved yet.`);
    }

    // Remove the marker from Dynmap using RCON
    const dynmapCommand = `dmarker delete id:${location.marker_id}`;
    try {
      const response = await executeRconCommand(dynmapCommand);
      console.log('Dynmap remove command response:', response);

      // Update the database to mark the location as removed
      await db.query(
        'UPDATE locations SET removed = TRUE, modified_at = CURRENT_TIMESTAMP WHERE id = $1',
        [locationId]
      );

      // Log the removal in the audit_log
      await db.query(
        'INSERT INTO audit_log (location_id, action_type, modified_by, old_values, new_values) VALUES ($1, $2, $3, $4, $5)',
        [locationId, 'REMOVE', message.author.username, JSON.stringify({removed: false}), JSON.stringify({removed: true})]
      );

      message.channel.send(`Location ${location.location_name} (ID: ${location.id}) has been removed from Dynmap.`);
    } catch (rconError) {
      console.error('Dynmap command error:', rconError);
      message.channel.send(`Error removing marker from Dynmap: ${rconError.message}`);
    }
  } catch (err) {
    console.error('Error removing location:', err);
    message.channel.send('Error removing location.');
  }
};

const listAllLocations = async (message) => {
  try {
    const result = await db.query('SELECT * FROM locations ORDER BY id');
    if (result.rows.length === 0) {
      message.channel.send('No locations found in the database.');
    } else {
      const locationList = result.rows.map(loc => 
        `ID: ${loc.id} | User: ${loc.minecraft_username} | Location: ${loc.location_name} | Coords: ${loc.x_coord}, ${loc.z_coord} | Status: ${loc.status} | marker_ID: ${loc.marker_id}`
      ).join('\n');
      
      // Split the message if it's too long
      const chunkSize = 1900; // Discord has a 2000 character limit, we leave some room for the header
      for (let i = 0; i < locationList.length; i += chunkSize) {
        const chunk = locationList.slice(i, i + chunkSize);
        message.channel.send(`Locations (${i/chunkSize + 1}):\n${chunk}`);
      }
    }
  } catch (err) {
    console.error('Error fetching locations:', err);
    message.channel.send('Error fetching locations.');
  }
};

const checkMarkerID = async (message, locationId) => {
  try {
    const result = await db.query('SELECT * FROM locations WHERE id = $1', [locationId]);
    if (result.rows.length === 0) {
      message.channel.send(`No location found with ID ${locationId}`);
    } else {
      const loc = result.rows[0];
      if (loc.marker_id) {
        message.channel.send(`Location ${loc.location_name} (ID: ${loc.id}) has Marker ID: ${loc.marker_id}`);
      } else {
        message.channel.send(`Location ${loc.location_name} (ID: ${loc.id}) does not have a Marker ID.`);
      }
    }
  } catch (err) {
    console.error('Error checking marker ID:', err);
    message.channel.send('Error checking marker ID.');
  }
};

client.on('messageCreate', async (message) => {
  if (message.content.toLowerCase() === '!add') {
    if (message.channel.id === process.env.ADD_CHANNEL_ID) {
      if (message.channel.type === 'dm') {
      await submitLocation(message.author);
    } else {
      await message.reply('Let\'s add a new location! Please check your DMs.');
      await submitLocation(message.author);
    }
    }
  } else if (message.content.toLowerCase() === '!pending') {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      await listPendingLocations(message);
    }
  } else if (message.content.toLowerCase().startsWith('!approve ')) {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      const locationId = message.content.split(' ')[1];
      await approveLocation(message, locationId);
    }
  } else if (message.content.toLowerCase().startsWith('!deny ')) {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      const locationId = message.content.split(' ')[1];
      await denyLocation(message, locationId);
    }
  } else if (message.content.toLowerCase() === '!testrcon') {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      await testRcon(message);
    }
  } else if (message.content.toLowerCase().startsWith('!remove ')) {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      const locationId = message.content.split(' ')[1];
      await removeLocation(message, locationId);
    }
  } else if (message.content.toLowerCase() === '!listall') {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      await listAllLocations(message);
    }
  } else if (message.content.toLowerCase().startsWith('!checkmarker ')) {
    if (message.channel.id === process.env.ADMIN_CHANNEL_ID) {
      const locationId = message.content.split(' ')[1];
      await checkMarkerID(message, locationId);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
