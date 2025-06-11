import { query } from './db';

async function updateSchema() {
  console.log('Starting schema update...');
  
  try {
    // Start a transaction
    await query('BEGIN');
    
    // Check if provider_id column already exists
    const checkColumnResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'invoices' AND column_name = 'provider_id'
    `);
    
    if (checkColumnResult.rows.length === 0) {
      console.log('Adding provider_id column to invoices table...');
      
      // Add provider_id column
      await query(`
        ALTER TABLE invoices 
        ADD COLUMN provider_id UUID REFERENCES providers(id)
      `);
      
      // Make client_id nullable
      await query(`
        ALTER TABLE invoices 
        ALTER COLUMN client_id DROP NOT NULL
      `);
      
      // Add constraint to ensure either client_id or provider_id is provided
      await query(`
        ALTER TABLE invoices 
        ADD CONSTRAINT check_entity_reference CHECK (
          (client_id IS NOT NULL AND provider_id IS NULL) OR 
          (client_id IS NULL AND provider_id IS NOT NULL)
        )
      `);
      
      // Add index for provider_id
      await query(`
        CREATE INDEX idx_invoices_provider ON invoices(provider_id)
      `);
      
      console.log('Schema updated successfully!');
    } else {
      console.log('provider_id column already exists. No changes needed.');
    }
    
    // Commit the transaction
    await query('COMMIT');
    console.log('Schema update completed successfully!');
    
  } catch (error) {
    // Rollback the transaction in case of error
    await query('ROLLBACK');
    console.error('Error updating schema:', error);
    throw error;
  }
}

// Run the update
updateSchema()
  .then(() => {
    console.log('Schema update script completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema update failed:', error);
    process.exit(1);
  }); 