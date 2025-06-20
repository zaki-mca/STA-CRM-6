import pgPromise from 'pg-promise';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pgp = pgPromise();

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sta_crm',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

export const db = pgp(config);

// Helper function to check database connection
export const checkConnection = async () => {
  try {
    await db.one('SELECT 1');
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
};

// Query function with enhanced logging, retries and robust error handling
export async function query(text: string, params: any[] = []): Promise<any> {
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
    client = await db.connect();
    
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
  } catch (err: any) {
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
    } else if (err.code === '23503') { // Foreign key violation
      throw new Error(`Referenced record does not exist: ${err.detail || err.message}`);
    } else if (err.code === '42P01') { // Table doesn't exist
      throw new Error(`Table not found: ${err.message}`);
    } else if (err.code === '42703') { // Column doesn't exist
      throw new Error(`Column not found: ${err.message}`);
    }
    
    // Re-throw with more context
    throw err;
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Transaction support
export async function withTransaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Export enhanced health check function
export async function checkHealth(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result && result.rows && result.rows.length > 0;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}

// Export the pool for direct use if needed
export default db; 