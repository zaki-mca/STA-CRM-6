import { query } from './db';

async function checkUsers() {
  try {
    const result = await query('SELECT * FROM users');
    console.log('Users in database:', result.rows);
  } catch (error) {
    console.error('Error checking users:', error);
  }
}

checkUsers(); 