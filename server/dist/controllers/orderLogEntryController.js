"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class OrderLogEntryController extends baseController_1.BaseController {
    constructor() {
        super('order_log_entries');
        // Add a single order to a log
        this.addOrderToLog = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { order_log_id, order_id, notes } = req.body;
            // Check if order log exists
            const logCheck = await (0, db_1.query)('SELECT id FROM order_logs WHERE id = $1', [order_log_id]);
            if (logCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order log not found with this ID', 404));
            }
            // Check if order exists
            const orderCheck = await (0, db_1.query)('SELECT id FROM orders WHERE id = $1', [order_id]);
            if (orderCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order not found with this ID', 404));
            }
            // Add the order to the log_entries table
            try {
                const result = await (0, db_1.query)(`INSERT INTO order_log_entries (order_log_id, order_id, notes)
         VALUES ($1, $2, $3)
         ON CONFLICT (order_log_id, order_id) 
         DO UPDATE SET notes = EXCLUDED.notes, added_at = CURRENT_TIMESTAMP
         RETURNING *`, [order_log_id, order_id, notes || null]);
                // Update the log's updated_at timestamp
                await (0, db_1.query)(`UPDATE order_logs 
         SET updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [order_log_id]);
                res.status(201).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (err) {
                console.error('Error adding order to log:', err);
                return next(new errorHandler_1.AppError('Failed to add order to log. The order may already be in this log.', 400));
            }
        });
        // Add multiple orders to a log in a batch
        this.addOrdersBatch = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { order_log_id, entries } = req.body;
            if (!entries || !Array.isArray(entries) || entries.length === 0) {
                return next(new errorHandler_1.AppError('At least one order entry is required', 400));
            }
            // Check if order log exists
            const logCheck = await (0, db_1.query)('SELECT id FROM order_logs WHERE id = $1', [order_log_id]);
            if (logCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order log not found with this ID', 404));
            }
            // Prepare values for batch insert
            const values = [];
            const params = [];
            let paramIndex = 1;
            for (const entry of entries) {
                values.push(`($${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2})`);
                params.push(order_log_id, entry.order_id, entry.notes || null);
                paramIndex += 3;
            }
            // Add the orders to the log_entries table
            try {
                const result = await (0, db_1.query)(`INSERT INTO order_log_entries (order_log_id, order_id, notes)
         VALUES ${values.join(', ')}
         ON CONFLICT (order_log_id, order_id) 
         DO UPDATE SET notes = EXCLUDED.notes, added_at = CURRENT_TIMESTAMP
         RETURNING *`, params);
                // Update the log's updated_at timestamp
                await (0, db_1.query)(`UPDATE order_logs 
         SET updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`, [order_log_id]);
                res.status(201).json({
                    status: 'success',
                    results: result.rows.length,
                    data: result.rows
                });
            }
            catch (err) {
                console.error('Error adding orders to log:', err);
                return next(new errorHandler_1.AppError('Failed to add orders to log. Check for duplicate orders or invalid IDs.', 400));
            }
        });
        // Get entries for a specific log
        this.getEntriesByLogId = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { logId } = req.params;
            // Check if order log exists
            const logCheck = await (0, db_1.query)('SELECT id FROM order_logs WHERE id = $1', [logId]);
            if (logCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order log not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
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
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Remove an order from a log
        this.removeOrderFromLog = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Check if entry exists
            const entryCheck = await (0, db_1.query)('SELECT id FROM order_log_entries WHERE id = $1', [id]);
            if (entryCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order log entry not found with this ID', 404));
            }
            // Get the log ID before deleting the entry
            const logResult = await (0, db_1.query)('SELECT order_log_id FROM order_log_entries WHERE id = $1', [id]);
            const order_log_id = logResult.rows[0].order_log_id;
            // Delete the entry
            await (0, db_1.query)('DELETE FROM order_log_entries WHERE id = $1', [id]);
            // Update the log's updated_at timestamp
            await (0, db_1.query)(`UPDATE order_logs 
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`, [order_log_id]);
            res.status(200).json({
                status: 'success',
                message: 'Order removed from log successfully'
            });
        });
    }
}
exports.default = new OrderLogEntryController();
//# sourceMappingURL=orderLogEntryController.js.map