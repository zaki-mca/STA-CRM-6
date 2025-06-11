"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config({ path: path.resolve(__dirname, '../../.env') });
const createDatabase = async () => {
    // Connect to default postgres database
    const pool = new pg_1.Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432'),
        database: 'postgres', // Connect to default postgres database first
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    try {
        // Check if database exists
        const checkDbResult = await pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [process.env.PGDATABASE]);
        if (checkDbResult.rows.length === 0) {
            // Create the database if it doesn't exist
            console.log(`Creating database '${process.env.PGDATABASE}'...`);
            await pool.query(`CREATE DATABASE ${process.env.PGDATABASE}`);
            console.log(`Database '${process.env.PGDATABASE}' created successfully!`);
        }
        else {
            console.log(`Database '${process.env.PGDATABASE}' already exists.`);
        }
        // Close the connection to the postgres database
        await pool.end();
    }
    catch (error) {
        console.error('Error creating database:', error);
        process.exit(1);
    }
};
const createTables = async () => {
    // Create a new connection pool for the app database
    const pool = new pg_1.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    try {
        // Read the schema SQL file
        const schemaPath = path.resolve(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        // Execute the SQL commands
        console.log('Setting up database tables...');
        await pool.query(schema);
        console.log('Database tables created successfully!');
        // Close the pool
        await pool.end();
    }
    catch (error) {
        console.error('Error setting up database tables:', error);
        process.exit(1);
    }
};
const setupDatabase = async () => {
    try {
        await createDatabase();
        await createTables();
        console.log('Database setup completed successfully!');
    }
    catch (error) {
        console.error('Database setup failed:', error);
        process.exit(1);
    }
};
// Run the setup if this file is executed directly
if (require.main === module) {
    setupDatabase();
}
exports.default = setupDatabase;
//# sourceMappingURL=setupDb.js.map