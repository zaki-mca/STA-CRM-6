import { query } from './db';

async function dropTables() {
  try {
    await query('DROP TABLE IF EXISTS user_permissions, permissions, users CASCADE;');
    console.log('Tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
  }
}

dropTables(); 