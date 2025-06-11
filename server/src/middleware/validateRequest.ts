import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';

export const validateRequest = (schema: AnyZodObject) => 
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      console.log('Validating request:', req.method, req.originalUrl);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      console.log('Validation passed');
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map(err => ({
          path: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        console.error('Validation failed:', JSON.stringify(formattedErrors, null, 2));
        console.error('Received body:', JSON.stringify(req.body, null, 2));
        
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: formattedErrors,
          received: {
            body: req.body
          }
        });
      }
      
      console.error('Unexpected validation error:', error);
      next(error);
    }
  }; 