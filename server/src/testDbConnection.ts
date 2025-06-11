import { checkHealth } from './db';

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const isHealthy = await checkHealth();
    
    if (isHealthy) {
      console.log('Database connection is healthy!');
    } else {
      console.error('Database connection is not healthy!');
    }
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    process.exit(0);
  }
}

testConnection(); 