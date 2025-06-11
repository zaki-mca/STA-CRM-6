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
async function runMigrations() {
    // Connect to PostgreSQL
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        // Start a transaction
        await client.query('BEGIN');
        // Get all migration files and sort them
        // Use src directory for migrations, not dist
        const migrationsDir = process.env.NODE_ENV === 'production'
            ? path_1.default.join(__dirname, 'migrations')
            : path_1.default.join(__dirname, '..', '..', 'src', 'db', 'migrations');
        const migrationFiles = fs_1.default.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort to ensure migrations run in order
        console.log(`Found ${migrationFiles.length} migration files to run`);
        // Run each migration file
        for (const file of migrationFiles) {
            console.log(`Running migration: ${file}`);
            const migrationPath = path_1.default.join(migrationsDir, file);
            const migrationSQL = fs_1.default.readFileSync(migrationPath, 'utf8');
            // Execute the migration
            await client.query(migrationSQL);
            console.log(`Completed migration: ${file}`);
        }
        // Commit the transaction
        await client.query('COMMIT');
        console.log('All migrations completed successfully!');
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
// Run the migrations
runMigrations()
    .then(() => {
    console.log('Database updated successfully');
    process.exit(0);
})
    .catch((error) => {
    console.error('Failed to update database:', error);
    process.exit(1);
});
//# sourceMappingURL=runMigration.js.map