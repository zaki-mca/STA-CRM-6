import { BaseController } from '../utils/baseController';
import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';

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
}

export default new ProfessionalDomainController(); 