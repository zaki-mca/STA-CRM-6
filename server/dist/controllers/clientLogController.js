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
            // First get all logs with their primary client details
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      ORDER BY cl.log_date DESC, cl.created_at DESC
    `);
            // Now get the count of entries for each log
            const logsWithEntries = await Promise.all(result.rows.map(async (log) => {
                // Get count of entries for this log
                const entriesResult = await (0, db_1.query)(`
          SELECT COUNT(*) as entry_count
          FROM client_log_entries 
          WHERE client_log_id = $1
        `, [log.id]);
                // Add entry count to log data
                return {
                    ...log,
                    entries_count: parseInt(entriesResult.rows[0]?.entry_count || '0', 10)
                };
            }));
            res.status(200).json({
                status: 'success',
                results: logsWithEntries.length,
                data: logsWithEntries
            });
        });
        // Override getById to include client details
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Get the log with client details
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
            // Get all clients associated with this log via the entries table
            const entriesResult = await (0, db_1.query)(`
      SELECT cle.id, cle.client_id, cle.notes, cle.added_at,
             c.name as client_name, c.email as client_email,
             c.first_name, c.last_name
      FROM client_log_entries cle
      JOIN clients c ON cle.client_id = c.id
      WHERE cle.client_log_id = $1
      ORDER BY cle.added_at
    `, [id]);
            // Combine the results
            const logData = result.rows[0];
            logData.entries = entriesResult.rows || [];
            logData.totalEntries = entriesResult.rowCount || 0;
            res.status(200).json({
                status: 'success',
                data: logData
            });
        });
        // Override create to ensure all required fields
        this.create = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { log_date, client_id, description } = req.body;
            if (!log_date || !client_id || !description) {
                return next(new errorHandler_1.AppError('Log date, client ID, and description are required.', 400));
            }
            // First check if client exists
            const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [client_id]);
            if (clientCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client not found with this ID', 404));
            }
            // Create the log
            const result = await (0, db_1.query)(`INSERT INTO client_logs (log_date, client_id, description)
       VALUES ($1, $2, $3)
       RETURNING id, log_date, client_id, description, created_at, updated_at`, [log_date, client_id, description]);
            const newLog = result.rows[0];
            // Also add the client to the client_log_entries table
            try {
                await (0, db_1.query)(`INSERT INTO client_log_entries (client_log_id, client_id, notes)
         VALUES ($1, $2, $3)`, [newLog.id, client_id, 'First client in log']);
            }
            catch (err) {
                console.error('Error adding first client to log entries:', err);
                // Continue even if this fails, as the main log was created successfully
            }
            // Fetch the client details to include in response
            const clientResult = await (0, db_1.query)(`SELECT name as client_name, email as client_email FROM clients WHERE id = $1`, [client_id]);
            const logData = {
                ...newLog,
                client_name: clientResult.rows[0]?.client_name,
                client_email: clientResult.rows[0]?.client_email,
                entries: [{
                        client_id,
                        client_name: clientResult.rows[0]?.client_name,
                        client_email: clientResult.rows[0]?.client_email,
                        added_at: newLog.created_at,
                        notes: 'First client in log'
                    }],
                entries_count: 1
            };
            res.status(201).json({
                status: 'success',
                data: logData
            });
        });
        // Override update to handle action-based updates
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { action, clientId, notes, closedAt } = req.body;
            // Check if log exists
            const logCheck = await (0, db_1.query)('SELECT * FROM client_logs WHERE id = $1', [id]);
            if (logCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Client log not found with this ID', 404));
            }
            // Handle different actions
            if (action === 'addClient') {
                if (!clientId) {
                    return next(new errorHandler_1.AppError('Client ID is required to add client to log', 400));
                }
                // Check if client exists
                const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [clientId]);
                if (clientCheck.rows.length === 0) {
                    return next(new errorHandler_1.AppError('Client not found with this ID', 404));
                }
                // First update the log with action
                await (0, db_1.query)(`UPDATE client_logs 
         SET action = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [action, id]);
                // Then add the client to the log_entries table
                try {
                    await (0, db_1.query)(`INSERT INTO client_log_entries (client_log_id, client_id, notes)
           VALUES ($1, $2, $3)
           ON CONFLICT (client_log_id, client_id) 
           DO UPDATE SET notes = EXCLUDED.notes, added_at = CURRENT_TIMESTAMP`, [id, clientId, notes || null]);
                }
                catch (err) {
                    console.error('Error adding client to log:', err);
                    return next(new errorHandler_1.AppError('Failed to add client to log. The client may already be in this log.', 400));
                }
            }
            else if (action === 'close') {
                await (0, db_1.query)(`UPDATE client_logs 
         SET action = $1, closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`, [action, id]);
            }
            else {
                // For general updates without specific action
                const { description, log_date, client_id } = req.body;
                const updateFields = [];
                const params = [];
                let paramCount = 1;
                if (action) {
                    updateFields.push(`action = $${paramCount}`);
                    params.push(action);
                    paramCount++;
                }
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
                if (client_id !== undefined) {
                    // Check if client exists
                    const clientCheck = await (0, db_1.query)('SELECT id FROM clients WHERE id = $1', [client_id]);
                    if (clientCheck.rows.length === 0) {
                        return next(new errorHandler_1.AppError('Client not found with this ID', 404));
                    }
                    updateFields.push(`client_id = $${paramCount}`);
                    params.push(client_id);
                    paramCount++;
                }
                if (updateFields.length === 0) {
                    return next(new errorHandler_1.AppError('No fields to update', 400));
                }
                updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
                params.push(id);
                await (0, db_1.query)(`UPDATE client_logs 
         SET ${updateFields.join(', ')} 
         WHERE id = $${paramCount}`, params);
            }
            // Get updated log with client details and associated clients
            const result = await (0, db_1.query)(`
      SELECT cl.*, 
        c.name as client_name, 
        c.email as client_email
      FROM client_logs cl
      JOIN clients c ON cl.client_id = c.id
      WHERE cl.id = $1
    `, [id]);
            // Now get all clients associated with this log via the entries table
            const entriesResult = await (0, db_1.query)(`
      SELECT cle.id, cle.client_id, cle.notes, cle.added_at,
             c.name as client_name, c.email as client_email
      FROM client_log_entries cle
      JOIN clients c ON cle.client_id = c.id
      WHERE cle.client_log_id = $1
      ORDER BY cle.added_at
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