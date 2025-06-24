import { BaseController } from '../utils/baseController';
import { Request, Response } from 'express';
import { catchAsync, AppError } from '../utils/errorHandler';
import { parseFile } from '../utils/fileParser';
import { query } from '../db';

class BrandController extends BaseController {
  constructor() {
    super('product_brands');
  }
  
  bulkUpload = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    try {
      // Parse the uploaded file using the unified file parser
      const validRecords = await parseFile(req.file);
      
      if (validRecords.length === 0) {
        throw new AppError('No valid brand records found in file', 400);
      }
      
      // Insert records into database
      const insertedItems = [];
      
      for (const record of validRecords) {
        // Check if brand already exists
        const existingBrand = await query(
          `SELECT * FROM ${this.tableName} WHERE name = $1`,
          [record.name]
        );
        
        if (existingBrand.rows.length === 0) {
          // Insert new brand
          const result = await query(
            `INSERT INTO ${this.tableName} (name) VALUES ($1) RETURNING *`,
            [record.name]
          );
          
          insertedItems.push(result.rows[0]);
        }
      }
      
      res.status(200).json({
        status: 'success',
        message: `${insertedItems.length} brands imported successfully`,
        items: insertedItems
      });
      
    } catch (error: any) {
      throw new AppError(`Error processing file: ${error.message}`, 400);
    }
  });
}

export default new BrandController(); 