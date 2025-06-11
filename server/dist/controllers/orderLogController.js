"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class OrderLogController extends baseController_1.BaseController {
    constructor() {
        super('order_logs');
        // Override getAll to include order details
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`
      SELECT ol.*, 
        o.order_number,
        c.name as client_name,
        o.status as order_status
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      ORDER BY ol.log_date DESC, ol.created_at DESC
    `);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Override getById to include order details
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT ol.*, 
        o.order_number,
        c.name as client_name,
        o.status as order_status
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ol.id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order log not found with this ID', 404));
            }
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        // Get logs by order ID
        this.getLogsByOrder = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { orderId } = req.params;
            // First check if order exists
            const orderCheck = await (0, db_1.query)('SELECT id FROM orders WHERE id = $1', [orderId]);
            if (orderCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Order not found with this ID', 404));
            }
            const result = await (0, db_1.query)(`
      SELECT ol.*, 
        o.order_number,
        c.name as client_name,
        o.status as order_status
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ol.order_id = $1
      ORDER BY ol.log_date DESC, ol.created_at DESC
    `, [orderId]);
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
      SELECT ol.*, 
        o.order_number,
        c.name as client_name,
        o.status as order_status
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ol.log_date BETWEEN $1 AND $2
      ORDER BY ol.log_date DESC, ol.created_at DESC
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
      SELECT ol.*, 
        o.order_number,
        c.name as client_name,
        o.status as order_status
      FROM order_logs ol
      JOIN orders o ON ol.order_id = o.id
      JOIN clients c ON o.client_id = c.id
      WHERE ol.log_date = $1
      ORDER BY ol.created_at DESC
    `, [today]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new OrderLogController();
//# sourceMappingURL=orderLogController.js.map