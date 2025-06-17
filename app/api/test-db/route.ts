import { NextResponse } from 'next/server';
import { query, checkHealth } from '@/lib/db';
import { catchAsync } from '@/lib/api-utils';

// GET /api/test-db - Test database connectivity
export const GET = catchAsync(async () => {
  try {
    // Run a simple query
    const result = await query('SELECT NOW() as time, current_database() as database');
    
    // Check overall health
    const isHealthy = await checkHealth();
    
    return NextResponse.json({
      status: 'success',
      time: result.rows[0].time,
      database: result.rows[0].database,
      healthy: isHealthy,
      message: 'Database connection successful'
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    return NextResponse.json({
      status: 'error',
      error: error.message,
      details: {
        code: error.code,
        hint: error.hint,
      }
    }, { status: 500 });
  }
}); 