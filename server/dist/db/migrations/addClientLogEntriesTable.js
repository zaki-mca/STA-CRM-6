"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../../db");
async function addClientLogEntriesTable() {
    try {
        console.log('Starting migration to add client_log_entries table...');
        // Create client_log_entries table
        await (0, db_1.query)(`
      CREATE TABLE IF NOT EXISTS client_log_entries (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        client_log_id UUID NOT NULL REFERENCES client_logs(id) ON DELETE CASCADE,
        client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        notes TEXT,
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(client_log_id, client_id)
      );
    `);
        console.log('Created client_log_entries table');
        // Add indices for better performance
        await (0, db_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_client_log_entries_log_id ON client_log_entries(client_log_id);
      CREATE INDEX IF NOT EXISTS idx_client_log_entries_client_id ON client_log_entries(client_id);
    `);
        console.log('Created indices on client_log_entries table');
        console.log('Migration completed successfully!');
    }
    catch (error) {
        console.error('Error during migration:', error);
        throw error;
    }
}
// Execute the migration
addClientLogEntriesTable()
    .then(() => {
    console.log('Migration completed');
    process.exit(0);
})
    .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});
//# sourceMappingURL=addClientLogEntriesTable.js.map