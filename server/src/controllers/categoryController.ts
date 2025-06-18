import { BaseController } from '../utils/baseController';
import { Request, Response } from 'express';
import { catchAsync, AppError } from '../utils/errorHandler';
import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';
import { query } from '../db';
import xlsx from 'xlsx';

class CategoryController extends BaseController {
  constructor() {
    super('product_categories');
  }
  
  bulkUpload = catchAsync(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const file = req.file;
    const filePath = file.path;
    const fileExt = path.extname(file.originalname).toLowerCase();
    const results: any[] = [];
    
    try {
      // Process CSV files
      if (fileExt === '.csv') {
        await new Promise<void>((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => resolve())
            .on('error', (error) => reject(error));
        });
      } 
      // Process Excel files
      else if (fileExt === '.xlsx' || fileExt === '.xls') {
        const workbook = xlsx.readFile(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = xlsx.utils.sheet_to_json(sheet);
        results.push(...jsonData);
      }
      // Process TXT files (assuming comma-separated or tab-separated)
      else if (fileExt === '.txt') {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const headers = lines[0].split(/[,\t]/).map(h => h.trim());
        
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;
          
          const values = lines[i].split(/[,\t]/).map(v => v.trim());
          const obj: any = {};
          
          headers.forEach((header, index) => {
            if (index < values.length) {
              obj[header] = values[index];
            }
          });
          
          results.push(obj);
        }
      }

      // Filter out records without required name field
      const validRecords = results.filter(record => record.name || record.Name || record.NAME);
      
      if (validRecords.length === 0) {
        throw new AppError('No valid category records found in file', 400);
      }
      
      // Insert records into database
      const insertedItems = [];
      
      for (const record of validRecords) {
        const name = record.name || record.Name || record.NAME;
        
        // Check if category already exists
        const existingCategory = await query(
          `SELECT * FROM ${this.tableName} WHERE name = $1`,
          [name]
        );
        
        if (existingCategory.rows.length === 0) {
          // Insert new category
          const result = await query(
            `INSERT INTO ${this.tableName} (name) VALUES ($1) RETURNING *`,
            [name]
          );
          
          insertedItems.push(result.rows[0]);
        }
      }
      
      res.status(200).json({
        status: 'success',
        message: `${insertedItems.length} categories imported successfully`,
        items: insertedItems
      });
      
    } catch (error: any) {
      throw new AppError(`Error processing file: ${error.message}`, 400);
    }
  });
}

export default new CategoryController(); 