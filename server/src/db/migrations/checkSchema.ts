import { query } from '../../db';

async function checkSchema() {
  try {
    console.log('Checking client_logs table schema...');
    
    const result = await query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1',
      ['client_logs']
    );
    
    console.table(result.rows);
    console.log('Schema check completed.');
  } catch (error) {
    console.error('Error checking schema:', error);
  }
}

// Execute the schema check
checkSchema()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Schema check failed:', err);
    process.exit(1);
  }); 