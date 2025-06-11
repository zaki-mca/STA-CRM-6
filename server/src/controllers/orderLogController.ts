import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';
import { BaseController } from '../utils/baseController';

class OrderLogController extends BaseController {
  constructor() {
    super('order_logs');
  }

  // Override getAll to include order details
  getAll = catchAsync(async (req: Request, res: Response) => {
    // Get all logs
    const result = await query(`
      SELECT ol.*
      FROM order_logs ol
      ORDER BY ol.log_date DESC, ol.created_at DESC
    `);
    
    // Now get the count and details of entries for each log
    const logsWithEntries = await Promise.all(
      result.rows.map(async (log: any) => {
        // Get entries for this log
        const entriesResult = await query(`
          SELECT ole.id, ole.order_id, ole.notes, ole.added_at,
                 o.order_number, o.status as order_status,
                 c.name as client_name,
                 (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
                  FROM order_items oi 
                  WHERE oi.order_id = o.id) as order_total
          FROM order_log_entries ole
          JOIN orders o ON ole.order_id = o.id
          JOIN clients c ON o.client_id = c.id
          WHERE ole.order_log_id = $1
          ORDER BY ole.added_at
        `, [log.id]);
        
        return {
          ...log,
          entries: entriesResult.rows,
          totalEntries: entriesResult.rowCount
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: logsWithEntries.length,
      data: logsWithEntries
    });
  });

  // Override getById to include order details
  getById = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    
    // Get the log
    const result = await query(`
      SELECT ol.*
      FROM order_logs ol
      WHERE ol.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return next(new AppError('Order log not found with this ID', 404));
    }
    
    // Now get all orders associated with this log via the entries table
    const entriesResult = await query(`
      SELECT ole.id, ole.order_id, ole.notes, ole.added_at,
             o.order_number, o.status as order_status,
             c.name as client_name,
             (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
              FROM order_items oi 
              WHERE oi.order_id = o.id) as order_total
      FROM order_log_entries ole
      JOIN orders o ON ole.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ole.order_log_id = $1
      ORDER BY ole.added_at
    `, [id]);

    // Combine the results
    const logData = result.rows[0] || {};
    logData.entries = entriesResult.rows || [];
    logData.totalEntries = entriesResult.rowCount || 0;
    
    res.status(200).json({
      status: 'success',
      data: logData
    });
  });

  // Override create to handle multiple orders
  create = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { description, log_date, user_id, orders } = req.body;
    
    // Start a transaction
    await query('BEGIN');
    
    try {
      // First create the log
      const logResult = await query(
        `INSERT INTO order_logs (description, log_date, user_id, created_at, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [description, log_date, user_id]
      );
      
      const logId = logResult.rows[0].id;
      const logData = logResult.rows[0];
      logData.entries = [];
      
      // If orders are provided, add them to the log
      if (orders && Array.isArray(orders) && orders.length > 0) {
        // Prepare values for batch insert
        const values = [];
        const params = [];
        let paramIndex = 1;
        
        for (const order of orders) {
          values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
          params.push(logId, order.order_id, order.notes || null);
          paramIndex += 3;
        }
        
        // Add the orders to the log_entries table
        const entriesResult = await query(
          `INSERT INTO order_log_entries (order_log_id, order_id, notes)
           VALUES ${values.join(', ')}
           ON CONFLICT (order_log_id, order_id) 
           DO UPDATE SET notes = EXCLUDED.notes, added_at = CURRENT_TIMESTAMP
           RETURNING *`,
          params
        );
        
        // Get order details for the entries
        const orderDetailsResult = await query(`
          SELECT ole.id, ole.order_id, ole.notes, ole.added_at,
                 o.order_number, o.status as order_status,
                 c.name as client_name,
                 (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
                  FROM order_items oi 
                  WHERE oi.order_id = o.id) as order_total
          FROM order_log_entries ole
          JOIN orders o ON ole.order_id = o.id
          JOIN clients c ON o.client_id = c.id
          WHERE ole.order_log_id = $1
          ORDER BY ole.added_at
        `, [logId]);
        
        logData.entries = orderDetailsResult.rows;
        logData.totalEntries = orderDetailsResult.rowCount;
      }
      
      // Commit the transaction
      await query('COMMIT');
      
      res.status(201).json({
        status: 'success',
        data: logData
      });
    } catch (err) {
      // Rollback the transaction on error
      await query('ROLLBACK');
      console.error('Error creating order log:', err);
      return next(new AppError('Failed to create order log. Check for invalid order IDs.', 400));
    }
  });

  // Override update to handle action-based updates
  update = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { action } = req.body;
    
    // Check if log exists
    const logCheck = await query('SELECT * FROM order_logs WHERE id = $1', [id]);
    
    if (logCheck.rows.length === 0) {
      return next(new AppError('Order log not found with this ID', 404));
    }
    
    // Handle different actions
    if (action === 'close') {
      await query(
        `UPDATE order_logs 
         SET closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [id]
      );
    } else {
      // For general updates without specific action
      const { description, log_date } = req.body;
      
      const updateFields = [];
      const params = [];
      let paramCount = 1;
      
      if (description !== undefined) {
        updateFields.push(`description = $${paramCount}`);
        params.push(description);
        paramCount++;
      }
      
      if (log_date !== undefined) {
        updateFields.push(`log_date = $${paramCount}`);
        params.push(log_date);
        paramCount++;
      }
      
      if (updateFields.length === 0) {
        return next(new AppError('No fields to update', 400));
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      params.push(id);
      
      await query(
        `UPDATE order_logs 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramCount}`,
        params
      );
    }
    
    // Get updated log with order details
    const result = await query(`
      SELECT ol.*
      FROM order_logs ol
      WHERE ol.id = $1
    `, [id]);
    
    // Get entries for this log
    const entriesResult = await query(`
      SELECT ole.id, ole.order_id, ole.notes, ole.added_at,
             o.order_number, o.status as order_status,
             c.name as client_name,
             (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
              FROM order_items oi 
              WHERE oi.order_id = o.id) as order_total
      FROM order_log_entries ole
      JOIN orders o ON ole.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ole.order_log_id = $1
      ORDER BY ole.added_at
    `, [id]);
    
    // Combine the results
    const logData = result.rows[0] || {};
    logData.entries = entriesResult.rows || [];
    logData.totalEntries = entriesResult.rowCount || 0;
    
    res.status(200).json({
      status: 'success',
      data: logData
    });
  });

  // Get logs by order ID
  getLogsByOrder = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.params;
    
    // First check if order exists
    const orderCheck = await query('SELECT id FROM orders WHERE id = $1', [orderId]);
    
    if (orderCheck.rows.length === 0) {
      return next(new AppError('Order not found with this ID', 404));
    }
    
    // Get logs that contain this order via the entries table
    const result = await query(`
      SELECT ol.*, 
             COUNT(ole.id) as total_entries
      FROM order_logs ol
      JOIN order_log_entries ole ON ol.id = ole.order_log_id
      WHERE ole.order_id = $1
      GROUP BY ol.id
      ORDER BY ol.log_date DESC, ol.created_at DESC
    `, [orderId]);
    
    res.status(200).json({
      status: 'success',
      results: result.rows.length,
      data: result.rows
    });
  });

  // Get logs by date range
  getLogsByDateRange = catchAsync(async (req: Request, res: Response) => {
    const { start_date, end_date } = req.query;
    
    let query_str = `
      SELECT ol.*
      FROM order_logs ol
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      query_str += ` AND ol.log_date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      query_str += ` AND ol.log_date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    query_str += ` ORDER BY ol.log_date DESC, ol.created_at DESC`;
    
    const result = await query(query_str, params);
    
    // Now get the count and details of entries for each log
    const logsWithEntries = await Promise.all(
      result.rows.map(async (log: any) => {
        // Get entries for this log
        const entriesResult = await query(`
          SELECT COUNT(*) as entry_count
          FROM order_log_entries 
          WHERE order_log_id = $1
        `, [log.id]);
        
        return {
          ...log,
          totalEntries: parseInt(entriesResult.rows[0]?.entry_count || '0')
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: logsWithEntries.length,
      data: logsWithEntries
    });
  });

  // Get today's logs
  getTodayLogs = catchAsync(async (req: Request, res: Response) => {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await query(`
      SELECT ol.*
      FROM order_logs ol
      WHERE ol.log_date = $1
      ORDER BY ol.created_at DESC
    `, [today]);
    
    // Now get the count and details of entries for each log
    const logsWithEntries = await Promise.all(
      result.rows.map(async (log: any) => {
        // Get entries for this log
        const entriesResult = await query(`
          SELECT ole.id, ole.order_id, ole.notes, ole.added_at,
                 o.order_number, o.status as order_status,
                 c.name as client_name,
                 (SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0) 
                  FROM order_items oi 
                  WHERE oi.order_id = o.id) as order_total
          FROM order_log_entries ole
          JOIN orders o ON ole.order_id = o.id
          JOIN clients c ON o.client_id = c.id
          WHERE ole.order_log_id = $1
          ORDER BY ole.added_at
        `, [log.id]);
        
        return {
          ...log,
          entries: entriesResult.rows,
          totalEntries: entriesResult.rowCount
        };
      })
    );
    
    res.status(200).json({
      status: 'success',
      results: logsWithEntries.length,
      data: logsWithEntries
    });
  });
}

export default new OrderLogController(); 