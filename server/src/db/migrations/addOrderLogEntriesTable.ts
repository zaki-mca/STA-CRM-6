import { query } from '../../db';

async function addOrderLogEntriesTable() {
  try {
    console.log('Starting migration to add order_log_entries table...');
    
    // Create order_log_entries table
    await query(`
      CREATE TABLE IF NOT EXISTS order_log_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        order_log_id UUID NOT NULL REFERENCES order_logs(id) ON DELETE CASCADE,
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(order_log_id, order_id)
      );
    `);
    console.log('Created order_log_entries table');
    
    // Add indices for better performance
    await query(`
      CREATE INDEX IF NOT EXISTS idx_order_log_entries_log_id ON order_log_entries(order_log_id);
    `);
    console.log('Added index on order_log_id');
    
    await query(`
      CREATE INDEX IF NOT EXISTS idx_order_log_entries_order_id ON order_log_entries(order_id);
    `);
    console.log('Added index on order_id');
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error executing migration:', error);
    throw error;
  }
}

// Execute the migration
addOrderLogEntriesTable()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  }); 