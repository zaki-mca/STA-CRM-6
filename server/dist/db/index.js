"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Create a connection pool
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 2000, // How long to wait before timing out when connecting a new client
});
// Test the connection
pool.connect()
    .then(client => {
    console.log('Connected to PostgreSQL database');
    client.release();
})
    .catch(err => {
    console.error('Error connecting to PostgreSQL database:', err);
});
// Export query method for use in other modules
const query = (text, params) => pool.query(text, params);
exports.query = query;
// Export the pool for direct use if needed
exports.default = pool;
//# sourceMappingURL=index.js.map