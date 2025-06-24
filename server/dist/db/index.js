"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = query;
exports.withTransaction = withTransaction;
exports.checkHealth = checkHealth;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Connection settings
const connectionConfig = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    // Alternative: Use connection string if provided
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: Number(process.env.DB_POOL_MAX) || 20, // Maximum number of clients in the pool
    idleTimeoutMillis: Number(process.env.DB_IDLE_TIMEOUT) || 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: Number(process.env.DB_CONNECTION_TIMEOUT) || 5000, // Increased timeout for connection
};
// Log connection details (without sensitive info)
console.log('Database connection configuration:', {
    host: connectionConfig.host,
    port: connectionConfig.port,
    database: connectionConfig.database,
    user: connectionConfig.user,
    ssl: connectionConfig.ssl ? 'enabled' : 'disabled',
    connectionString: connectionConfig.connectionString ? 'provided' : 'not provided'
});
// Create a connection pool
const pool = new pg_1.Pool(connectionConfig);
// Connection management
let isConnected = false;
let connectionRetries = 0;
const MAX_RETRIES = Number(process.env.DB_CONNECTION_RETRIES) || 5;
const RETRY_DELAY = Number(process.env.DB_CONNECTION_RETRY_DELAY) || 5000;
// Monitor pool events
pool.on('connect', (client) => {
    isConnected = true;
    connectionRetries = 0;
    console.log('New client connected to PostgreSQL database');
});
pool.on('error', (err, client) => {
    isConnected = false;
    console.error('Unexpected error on idle client', err);
    // Attempt reconnection if within retry limits
    if (connectionRetries < MAX_RETRIES) {
        connectionRetries++;
        console.log(`Attempting to reconnect (retry ${connectionRetries}/${MAX_RETRIES})...`);
        setTimeout(() => {
            testConnection();
        }, RETRY_DELAY * connectionRetries); // Exponential backoff
    }
    else {
        console.error(`Failed to reconnect after ${MAX_RETRIES} attempts`);
    }
});
// Test the connection
const testConnection = async () => {
    let client = null;
    try {
        client = await pool.connect();
        console.log('Connected to PostgreSQL database');
        isConnected = true;
        connectionRetries = 0;
    }
    catch (err) {
        isConnected = false;
        console.error('Error connecting to PostgreSQL database:', err);
        // Attempt reconnection if within retry limits
        if (connectionRetries < MAX_RETRIES) {
            connectionRetries++;
            console.log(`Attempting to reconnect (retry ${connectionRetries}/${MAX_RETRIES})...`);
            setTimeout(() => {
                testConnection();
            }, RETRY_DELAY * connectionRetries); // Exponential backoff
        }
    }
    finally {
        if (client) {
            client.release();
        }
    }
};
// Initial connection test
testConnection();
// Query function with enhanced logging, retries and robust error handling
async function query(text, params = []) {
    let client;
    try {
        // Truncate long queries for logging
        const truncatedText = text.length > 200 ? `${text.substring(0, 200)}...` : text;
        // Debug info for query planning and potential issues
        const queryDebugInfo = {
            query: truncatedText,
            paramCount: params.length,
            timestamp: new Date().toISOString()
        };
        console.debug('DB Query:', queryDebugInfo);
        // Get client from pool
        client = await pool.connect();
        // Run query with timing
        const start = Date.now();
        const result = await client.query(text, params);
        const duration = Date.now() - start;
        // Log slow queries (over 500ms)
        if (duration > 500) {
            console.warn(`Slow query detected (${duration}ms):`, truncatedText);
        }
        console.debug('DB Result:', {
            rowCount: result.rowCount,
            duration: `${duration}ms`,
            success: true
        });
        return result;
    }
    catch (err) {
        // Enhanced error handling with better context
        console.error('Database query error:', {
            error: err.message,
            code: err.code,
            detail: err.detail,
            hint: err.hint,
            position: err.position,
            query: text.substring(0, 200) + (text.length > 200 ? '...' : ''),
            params: params.length > 0 ? 'Query contained parameters' : 'No parameters'
        });
        // Specific handling for common Postgres errors
        if (err.code === '23505') { // Unique violation
            throw new Error(`Duplicate entry: ${err.detail || err.message}`);
        }
        else if (err.code === '23503') { // Foreign key violation
            throw new Error(`Referenced record does not exist: ${err.detail || err.message}`);
        }
        else if (err.code === '42P01') { // Table doesn't exist
            throw new Error(`Table not found: ${err.message}`);
        }
        else if (err.code === '42703') { // Column doesn't exist
            throw new Error(`Column not found: ${err.message}`);
        }
        // Re-throw with more context
        throw err;
    }
    finally {
        // Always release the client back to the pool
        if (client) {
            client.release();
        }
    }
}
// Transaction support
async function withTransaction(callback) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    }
    catch (e) {
        await client.query('ROLLBACK');
        throw e;
    }
    finally {
        client.release();
    }
}
// Export enhanced health check function
async function checkHealth() {
    try {
        const result = await query('SELECT NOW()');
        return {
            healthy: result && result.rows && result.rows.length > 0,
            details: 'Database connection successful'
        };
    }
    catch (err) {
        console.error('Database health check failed:', err);
        // More specific error information
        let errorDetails = 'Unknown database error';
        if (err.code === 'ECONNREFUSED') {
            errorDetails = 'Connection refused - database server may be down';
        }
        else if (err.code === '28P01') {
            errorDetails = 'Authentication failed - invalid username or password';
        }
        else if (err.code === '3D000') {
            errorDetails = 'Database does not exist';
        }
        else if (err.message && err.message.includes('SASL')) {
            errorDetails = 'SASL authentication error - check database credentials';
        }
        return {
            healthy: false,
            details: errorDetails,
            error: process.env.NODE_ENV === 'development' ? err : undefined
        };
    }
}
// Export the pool for direct use if needed
exports.default = pool;
//# sourceMappingURL=index.js.map