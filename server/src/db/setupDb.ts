import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const createDatabase = async () => {
  // Connect to default postgres database
  const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT || '5432'),
    database: 'postgres', // Connect to default postgres database first
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Check if database exists
    const checkDbResult = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.PGDATABASE]
    );

    if (checkDbResult.rows.length === 0) {
      // Create the database if it doesn't exist
      console.log(`Creating database '${process.env.PGDATABASE}'...`);
      await pool.query(`CREATE DATABASE ${process.env.PGDATABASE}`);
      console.log(`Database '${process.env.PGDATABASE}' created successfully!`);
    } else {
      console.log(`Database '${process.env.PGDATABASE}' already exists.`);
    }

    // Close the connection to the postgres database
    await pool.end();
  } catch (error) {
    console.error('Error creating database:', error);
    process.exit(1);
  }
};

const createTables = async () => {
  // Create a new connection pool for the app database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // Read the schema SQL file
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Execute the SQL commands
    console.log('Setting up database tables...');
    await pool.query(schema);
    console.log('Database tables created successfully!');

    // Close the pool
    await pool.end();
  } catch (error) {
    console.error('Error setting up database tables:', error);
    process.exit(1);
  }
};

const setupDatabase = async () => {
  try {
    await createDatabase();
    await createTables();
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Database setup failed:', error);
    process.exit(1);
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

export default setupDatabase; 