require('dotenv').config();
const db = require('./db');

const createTablesQueries = `
  CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    minecraft_username VARCHAR(255) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    x_coord INTEGER NOT NULL,
    z_coord INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by VARCHAR(255),
    discord_message_id VARCHAR(255),
    marker_id VARCHAR(255),
    removed BOOLEAN DEFAULT FALSE,
    discord_user_id VARCHAR(255),
    discord_username VARCHAR(255)
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    location_id INTEGER REFERENCES locations(id),
    action_type VARCHAR(50) NOT NULL,
    modified_by VARCHAR(255) NOT NULL,
    modified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_values JSONB,
    new_values JSONB
  );
`;

const addColumnsQueries = [
  {
    check: "SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='marker_id'",
    add: "ALTER TABLE locations ADD COLUMN marker_id VARCHAR(255)"
  },
  {
    check: "SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='removed'",
    add: "ALTER TABLE locations ADD COLUMN removed BOOLEAN DEFAULT FALSE"
  },
  {
    check: "SELECT 1 FROM information_schema.columns WHERE table_name='locations' AND column_name='discord_user_id'",
    add: "ALTER TABLE locations ADD COLUMN discord_user_id VARCHAR(255)"
  }
];

const initDb = async () => {
  try {
    // Create tables
    await db.query(createTablesQueries);
    console.log('Tables created successfully');

    // Add columns if they don't exist
    for (const query of addColumnsQueries) {
      const result = await db.query(query.check);
      if (result.rows.length === 0) {
        await db.query(query.add);
        console.log(`Added column: ${query.add}`);
      }
    }

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    // Remove or modify this line
    // await db.end();
  }
};

initDb();
