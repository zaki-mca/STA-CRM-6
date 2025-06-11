"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables from .env file in the server directory
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Configure PostgreSQL connection using the same environment variables as the main app
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});
async function runInvoiceMigration() {
    // Connect to PostgreSQL
    const client = await pool.connect();
    try {
        console.log('Running invoice migration (provider_id change)...');
        // Start a transaction
        await client.query('BEGIN');
        // Get the migration file
        const migrationPath = path_1.default.join(__dirname, 'migrations', '011-replace-client-id-with-provider-id-in-invoices.sql');
        // Read the migration file
        const migrationSQL = fs_1.default.readFileSync(migrationPath, 'utf8');
        // Execute the migration
        await client.query(migrationSQL);
        console.log('Invoice migration completed successfully');
        // Commit the transaction
        await client.query('COMMIT');
    }
    catch (error) {
        // Rollback the transaction in case of error
        await client.query('ROLLBACK');
        console.error('Invoice migration failed:', error);
        throw error;
    }
    finally {
        // Release the client back to the pool
        client.release();
    }
}
// Run the migration
runInvoiceMigration()
    .then(() => {
    console.log('Invoice table updated successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Failed to update invoice table:', error);
    process.exit(1);
});
//# sourceMappingURL=runInvoiceMigration.js.map