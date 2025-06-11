"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class ClientLogController extends baseController_1.BaseController {
    constructor() {
        super('client_logs');
        // Override getAll to include client details
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      ORDER BY cl.log_date DESC, cl.created_at DESC
    `);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Override getById to include client details
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client log not found with this ID', 404));
            }
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Get logs by client ID
        this.getLogsByClient = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { clientId } = req.params;
            // First check if client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [clientId]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.client_id = $1
      ORDER BY cl.log_date DESC, cl.created_at DESC
    `, [clientId]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Get logs by date range
        this.getLogsByDateRange = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { startDate, endDate } = req.query;
            if (!startDate || !endDate) {
                return res.status(400).json({
                    status: 'error',
                    message: 'Start date and end date are required'
                });
            }
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.log_date BETWEEN $1 AND $2
      ORDER BY cl.log_date DESC, cl.created_at DESC
    `, [startDate, endDate]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Get logs for today
        this.getTodayLogs = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.log_date = $1
      ORDER BY cl.created_at DESC
    `, [today]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new ClientLogController();
//# sourceMappingURL=clientLogController.js.map