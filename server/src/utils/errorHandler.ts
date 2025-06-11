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
  
  // Handle PostgreSQL specific errors
  if (err.code && err.code.startsWith('23')) {
    // 23XXX are integrity constraint violations in PostgreSQL
    return res.status(400).json({
      status: 'error',
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

  res.status(statusCode).json({
    status,
    message: err.message,
    error: process.env.NODE_ENV === 'development' ? err : undefined,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

// Updated version with proper typing for Express
export const catchAsync = (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 