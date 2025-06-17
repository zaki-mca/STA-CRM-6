import { BaseController } from '../utils/baseController';
import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import pool from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';
import { ParsedRecord, parseFile } from '../utils/fileParser';

class ProfessionalDomainController extends BaseController {
  constructor() {
    super('professional_domains');
  }

  // Override create method to handle payment_code
  create = catchAsync(async (req: Request, res: Response) => {
    const { name, description, payment_code } = req.body;
    
    const result = await query(`
      INSERT INTO professional_domains (name, description, payment_code)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [name, description || '', payment_code || null]);
    
    res.status(201).json({
      status: 'success',
      data: result.rows[0]
    });
  });

  // Override update method to handle payment_code
  update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { name, description, payment_code } = req.body;
    
    // Validate that domain exists
    const domainCheck = await query('SELECT id FROM professional_domains WHERE id = $1', [id]);
    if (domainCheck.rows.length === 0) {
      return next(new AppError('Professional domain not found with this ID', 404));
    }
    
    const result = await query(`
      UPDATE professional_domains
      SET 
        name = COALESCE($1, name),
        description = COALESCE($2, description),
        payment_code = COALESCE($3, payment_code),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `, [name, description, payment_code, id]);
    
    res.status(200).json({
      status: 'success',
      data: result.rows[0]
    });
  });

  // Get clients by professional domain
  getClientsByDomain = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await query(`
      SELECT c.* 
      FROM clients c
      WHERE c.professional_domain_id = $1
      ORDER BY c.name
    `, [id]);
    
    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: result.rows
    });
  });

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
      const domains = await parseFile(req.file);

      // Insert domains in a transaction
      const client = await pool.connect();

      try {
        await client.query('BEGIN');
        
        const results = [];
        const duplicates = [];
        
        for (const domain of domains) {
          // Check if domain already exists
          const checkResult = await client.query(
            `SELECT * FROM ${this.tableName} WHERE name = $1`,
            [domain.name]
          );
          
          if (checkResult.rows.length > 0) {
            duplicates.push(domain.name);
            continue;
          }
          
          // Insert the new domain
          const result = await client.query(
            `INSERT INTO ${this.tableName} (name, description, payment_code) VALUES ($1, $2, $3) RETURNING *`,
            [domain.name, domain.description || '', domain.paymentCode || '']
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

export default new ProfessionalDomainController(); 