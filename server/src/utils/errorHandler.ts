import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const handleError = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';
  
  // Handle connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'ENOTFOUND') {
    console.error('Database connection error:', err);
    return res.status(503).json({
      status: 'error',
      message: 'Database connection failed. Please try again later.',
      retryable: true,
      code: 'DB_CONNECTION_ERROR'
    });
  }
  
  // Handle authentication errors
  if (err.code === '28P01' || (err.message && err.message.includes('SASL'))) {
    console.error('Database authentication error:', err);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error. The system is currently unavailable.',
      retryable: false,
      code: 'DB_AUTH_ERROR'
    });
  }
  
  // Handle PostgreSQL specific errors
  if (err.code === '23505') {
    // 23505 is unique violation in PostgreSQL (duplicate key)
    // Extract the column name and value from the error detail if available
    let message = 'A record with this information already exists. Please check for duplicates.';
    
    if (err.detail) {
      // Try to extract the column name and value from the error detail
      // Format is typically: "Key (column)=(value) already exists."
      const match = err.detail.match(/Key \(([^)]+)\)=\(([^)]+)\) already exists/);
      if (match) {
        const [, column, value] = match;
        message = `Duplicate entry: Key (${column})=(${value}) already exists.`;
      }
    }
    
    return res.status(400).json({
      status: 'fail',
      message
    });
  }
  
  // Handle other integrity constraint violations
  if (err.code && err.code.startsWith('23')) {
    return res.status(400).json({
      status: 'fail',
      message: 'Database constraint violation. Please check your input.',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }

  // Handle other database errors
  if (err.code && err.code.startsWith('42')) {
    // 42XXX are syntax errors or access rule violations in PostgreSQL
    return res.status(500).json({
      status: 'error',
      message: 'Database query error.',
      error: process.env.NODE_ENV === 'development' ? err : undefined
    });
  }

  // Default error response
  const errorResponse = {
    status,
    message: err.message || 'An unexpected error occurred',
    code: err.code || 'UNKNOWN_ERROR',
    retryable: statusCode >= 500, // 5xx errors are typically retryable
  };
  
  // Add debug info in development
  if (process.env.NODE_ENV === 'development') {
    Object.assign(errorResponse, {
      error: err,
      stack: err.stack,
      path: req.path
    });
  }
  
  res.status(statusCode).json(errorResponse);
};

// Updated version with proper typing for Express
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 