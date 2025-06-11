"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file in the server directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Configure PostgreSQL connection using the same environment variables as the main app
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
async function runSingleMigration() {
    // Connect to PostgreSQL
    const client = await pool.connect();
    try {
        console.log('Running migration for missing display fields...');
        // Start a transaction
        await client.query('BEGIN');
        // Define the migration SQL directly
        const migrationSQL = `
      -- Migration to ensure all required display fields are properly set up

      -- Make sure professional domains have payment codes
      UPDATE professional_domains
      SET payment_code = 'CODE-' || SUBSTRING(name FROM 1 FOR 3)
      WHERE payment_code IS NULL;

      -- Make sure all clients have birth_date for age calculation
      UPDATE clients
      SET birth_date = '1980-01-01'
      WHERE birth_date IS NULL;

      -- Make sure all products have sell_price and buy_price
      UPDATE products
      SET 
        sell_price = price,
        buy_price = price * 0.7
      WHERE sell_price IS NULL OR buy_price IS NULL;

      -- Make sure all providers have phone numbers
      UPDATE providers
      SET phone = 'N/A'
      WHERE phone IS NULL OR phone = '';
    `;
        // Execute the migration
        await client.query(migrationSQL);
        console.log('Migration completed successfully');
        // Commit the transaction
        await client.query('COMMIT');
    }
    catch (error) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    }
    finally {
        // Release the client back to the pool
        client.release();
    }
}
// Run the migration
runSingleMigration()
    .then(() => {
    console.log('Database updated successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Failed to update database:', error);
    process.exit(1);
});
//# sourceMappingURL=runSingleMigration.js.map