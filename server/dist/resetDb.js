"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const db_1 = require("./db");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function resetDatabase() {
    try {
        console.log('Starting database reset...');
        // Read the SQL schema file
        const schemaPath = path_1.default.join(__dirname, 'db', 'schema.sql');
        const schema = fs_1.default.readFileSync(schemaPath, 'utf8');
        // Execute the schema SQL
        console.log('Executing schema SQL...');
        await (0, db_1.query)(schema);
        console.log('Database reset completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}
// Run the reset function
resetDatabase();
//# sourceMappingURL=resetDb.js.map