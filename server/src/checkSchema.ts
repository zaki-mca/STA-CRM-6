import { query } from './db';

async function checkSchema() {
  try {
    console.log('Checking invoices table schema...');
    
    // Check columns in invoices table
    const columnsResult = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'invoices'
      ORDER BY ordinal_position
    `);
    
    console.log('Invoices table columns:');
    columnsResult.rows.forEach((row: any) => {
      console.log(`- ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`);
    });
    
    // Check constraints on invoices table
    const constraintsResult = await query(`
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'invoices'
    `);
    
    console.log('\nInvoices table constraints:');
    constraintsResult.rows.forEach((row: any) => {
      console.log(`- ${row.constraint_name} (${row.constraint_type})`);
    });
    
    // Check indexes on invoices table
    const indexesResult = await query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'invoices'
    `);
    
    console.log('\nInvoices table indexes:');
    indexesResult.rows.forEach((row: any) => {
      console.log(`- ${row.indexname}: ${row.indexdef}`);
    });
    
  } catch (error) {
    console.error('Error checking schema:', error);
    throw error;
  }
}

// Run the check
checkSchema()
  .then(() => {
    console.log('\nSchema check completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Schema check failed:', error);
    process.exit(1);
  }); 