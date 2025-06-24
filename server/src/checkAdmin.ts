import { query } from './db';

async function checkAdmin() {
  try {
    const result = await query('SELECT * FROM users WHERE email = $1', ['admin@stacrm.com']);
    console.log('User found:', result.rows);
  } catch (err) {
    console.error('Error:', err);
  }
}

checkAdmin(); 