import { BaseController } from '../utils/baseController';
import { Request, Response } from 'express';
import { catchAsync } from '../utils/errorHandler';
import { query } from '../db';
import pool from '../db';
import { ParsedRecord, parseFile } from '../utils/fileParser';

class CategoryController extends BaseController {
  constructor() {
    super('product_categories');
  }

  // Add a new method for bulk upload
  bulkCreate = catchAsync(async (req: Request, res: Response) => {
    // Ensure file was uploaded
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'No file uploaded'
      });
    }

    try {
      // Parse the file
      const categories = await parseFile(req.file);

      // Insert categories in a transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        
        const results = [];
        const duplicates = [];
        
        for (const category of categories) {
          // Check if category already exists
          const checkResult = await client.query(
            `SELECT * FROM ${this.tableName} WHERE name = $1`,
            [category.name]
          );
          
          if (checkResult.rows.length > 0) {
            duplicates.push(category.name);
            continue;
          }
          
          // Insert the new category
          const result = await client.query(
            `INSERT INTO ${this.tableName} (name, description) VALUES ($1, $2) RETURNING *`,
            [category.name, category.description || '']
          );
          
          if (result.rows.length > 0) {
            results.push(result.rows[0]);
          }
        }
        
        await client.query('COMMIT');
        
        return res.status(201).json({
          status: 'success',
          added: results.length,
          duplicates: duplicates.length,
          duplicateNames: duplicates,
          data: results
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error: any) {
      return res.status(400).json({
        status: 'error',
        message: `Failed to process file: ${error.message}`
      });
    }
  });
}

export default new CategoryController(); 