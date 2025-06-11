import { query } from '../../db';

async function addColumnsToOrderLogs() {
  try {
    console.log('Starting migration to add columns to order_logs table...');
    
    // Check if the action column already exists
    const checkActionColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_logs' AND column_name = 'action'
    `;
    
    const actionColumnCheck = await query(checkActionColumnSQL);
    
    if (actionColumnCheck.rows.length === 0) {
      // Add the action column to order_logs table if it doesn't exist
      await query(`
        ALTER TABLE order_logs
        ADD COLUMN action VARCHAR(50)
      `);
      console.log('Successfully added action column to order_logs table');
    } else {
      console.log('action column already exists in order_logs table');
    }
    
    // Check if the closed_at column already exists
    const checkClosedAtColumnSQL = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'order_logs' AND column_name = 'closed_at'
    `;
    
    const closedAtColumnCheck = await query(checkClosedAtColumnSQL);
    
    if (closedAtColumnCheck.rows.length === 0) {
      // Add the closed_at column to order_logs table if it doesn't exist
      await query(`
        ALTER TABLE order_logs
        ADD COLUMN closed_at TIMESTAMP WITH TIME ZONE
      `);
      console.log('Successfully added closed_at column to order_logs table');
    } else {
      console.log('closed_at column already exists in order_logs table');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

// Execute the migration
addColumnsToOrderLogs()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 