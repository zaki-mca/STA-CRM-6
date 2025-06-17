import { NextResponse, NextRequest } from 'next/server';

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

// Updated to handle Next.js App Router route handlers
export const catchAsync = <T>(
  handler: (...args: any[]) => Promise<T>,
  errorHandler?: (err: any) => NextResponse
) => {
  return async (...args: any[]): Promise<T> => {
    try {
      return await handler(...args);
    } catch (err: any) {
      console.error('API Error:', err);
      
      if (errorHandler) {
        return errorHandler(err) as unknown as T;
      }
      
      // Default error handling
      const statusCode = err.statusCode || 500;
      const message = err.message || 'Something went wrong';
      
      return NextResponse.json(
        { 
          status: err.status || 'error', 
          message,
          ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}) 
        },
        { status: statusCode }
      ) as unknown as T;
    }
  };
};

// Helper function to validate request parameters
export const validateParams = (
  params: Record<string, any>,
  schema: any
): { valid: boolean; errors?: any } => {
  try {
    schema.parse(params);
    return { valid: true };
  } catch (error: any) {
    return { 
      valid: false, 
      errors: error.errors || error.message
    };
  }
};

// Helper to extract data from FormData
export async function parseFormData(formData: FormData): Promise<Record<string, any>> {
  const data: Record<string, any> = {};
  
  // Convert FormData to JSON object
  formData.forEach((value, key) => {
    // Handle files separately if needed
    if (value instanceof File) {
      data[key] = value;
    } else {
      // Try to parse JSON values
      try {
        data[key] = JSON.parse(value as string);
      } catch (e) {
        data[key] = value;
      }
    }
  });
  
  return data;
} 