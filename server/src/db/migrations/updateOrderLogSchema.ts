import { query } from '../../db';

async function updateOrderLogSchema() {
  try {
    console.log('Starting migration to update order_logs table schema...');
    
    // First, check if the order_log_entries table exists
    const checkEntriesTable = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'order_log_entries'
      );
    `);
    
    if (!checkEntriesTable.rows[0].exists) {
      console.log('Creating order_log_entries table first...');
      // Create order_log_entries table if it doesn't exist
      await query(`
        CREATE TABLE IF NOT EXISTS order_log_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          order_log_id UUID NOT NULL REFERENCES order_logs(id) ON DELETE CASCADE,
          order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
          notes TEXT,
          added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(order_log_id, order_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_order_log_entries_log_id ON order_log_entries(order_log_id);
        CREATE INDEX IF NOT EXISTS idx_order_log_entries_order_id ON order_log_entries(order_id);
      `);
      console.log('Created order_log_entries table');
    }
    
    // Check if the order_id column exists in order_logs table
    const checkOrderIdColumn = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'order_logs' AND column_name = 'order_id'
      );
    `);
    
    if (checkOrderIdColumn.rows[0].exists) {
      console.log('Migrating existing data from order_logs to order_log_entries...');
      
      // Migrate existing data: Create entries in order_log_entries for each order_log with an order_id
      await query(`
        INSERT INTO order_log_entries (order_log_id, order_id, notes, added_at)
        SELECT id, order_id, 'Migrated from order_logs table', created_at
        FROM order_logs
        WHERE order_id IS NOT NULL
        ON CONFLICT (order_log_id, order_id) DO NOTHING;
      `);
      console.log('Data migration completed');
      
      // Drop the index on order_id if it exists
      try {
        await query(`DROP INDEX IF EXISTS idx_order_logs_order;`);
        console.log('Dropped index on order_id');
      } catch (error) {
        console.log('No index found or could not drop index:', (error as Error).message);
      }
      
      // First make the column nullable to remove any constraints
      try {
        await query(`
          ALTER TABLE order_logs
          ALTER COLUMN order_id DROP NOT NULL;
        `);
        console.log('Made order_id nullable in order_logs table');
      } catch (error) {
        console.log('Could not drop NOT NULL constraint:', (error as Error).message);
        // Continue anyway as we'll drop the column
      }
      
      // Now remove the column
      await query(`
        ALTER TABLE order_logs
        DROP COLUMN IF EXISTS order_id CASCADE;
      `);
      console.log('Removed order_id column from order_logs table');
    } else {
      console.log('The order_id column does not exist in order_logs table. No migration needed.');
    }
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

// Execute the migration
updateOrderLogSchema()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 