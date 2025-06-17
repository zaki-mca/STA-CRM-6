import { Pool, PoolClient } from 'pg';

// Load Supabase configuration for production
const isProduction = process.env.NODE_ENV === 'production';

// Connection settings using Supabase credentials
const connectionConfig = {
  // In production, use Supabase pooled connection
  connectionString: isProduction 
    ? process.env.SUPABASE_URL_POSTGRES_URL || process.env.DATABASE_URL
    : process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

// Create a singleton connection pool
const globalForPg = global as unknown as { pool: Pool | undefined };
const pool = globalForPg.pool ?? new Pool(connectionConfig);
if (process.env.NODE_ENV !== 'production') globalForPg.pool = pool;

// Query function with error handling
export async function query(text: string, params: any[] = []): Promise<any> {
  let client;
  try {
    // Get client from pool
    client = await pool.connect();
    
    // Run query
    const result = await client.query(text, params);
    return result;
  } catch (err: any) {
    console.error('Database query error:', {
      error: err.message,
      code: err.code,
      detail: err.detail,
      hint: err.hint,
    });
    
    throw err;
  } finally {
    // Always release the client back to the pool
    if (client) {
      client.release();
    }
  }
}

// Transaction support
export async function withTransaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
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

// Export health check function
export async function checkHealth(): Promise<boolean> {
  try {
    const result = await query('SELECT NOW()');
    return result && result.rows && result.rows.length > 0;
  } catch (err) {
    console.error('Database health check failed:', err);
    return false;
  }
}

export default pool; 