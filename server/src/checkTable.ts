import { query } from './db';

async function checkTable() {
  try {
    const result = await query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'users';`
    );
    console.log('Table structure:', result.rows);
  } catch (error) {
    console.error('Error checking table:', error);
  }
}

checkTable(); 