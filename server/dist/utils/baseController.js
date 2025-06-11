"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseController = void 0;
const db_1 = require("../db");
const errorHandler_1 = require("./errorHandler");
class BaseController {
    constructor(tableName) {
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`SELECT * FROM ${this.tableName} ORDER BY created_at DESC`);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`SELECT * FROM ${this.tableName} WHERE id = $1`, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError(`${this.tableName.slice(0, -1)} not found with this ID`, 404));
            }
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        this.create = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { body } = req;
            // Convert object to arrays of keys and values
            const keys = Object.keys(body);
            const values = Object.values(body);
            // Create placeholders for values
            const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
            // Create column names string
            const columns = keys.join(', ');
            // Create SQL query
            const queryText = `
      INSERT INTO ${this.tableName} (${columns})
      VALUES (${placeholders})
      RETURNING *
    `;
            const result = await (0, db_1.query)(queryText, values);
            res.status(201).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { body } = req;
            // Make sure there's something to update
            if (Object.keys(body).length === 0) {
                return next(new errorHandler_1.AppError('Please provide fields to update', 400));
            }
            // Convert object to arrays of keys
            const keys = Object.keys(body);
            const values = Object.values(body);
            // Create SET part of query using placeholders
            const setClause = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
            // Add id to values array (for the WHERE clause)
            values.push(id);
            // Create SQL query
            const queryText = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${values.length}
      RETURNING *
    `;
            const result = await (0, db_1.query)(queryText, values);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError(`${this.tableName.slice(0, -1)} not found with this ID`, 404));
            }
            res.status(200).json({
                status: 'success',
                data: result.rows[0]
            });
        });
        this.delete = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError(`${this.tableName.slice(0, -1)} not found with this ID`, 404));
            }
            res.status(200).json({
                status: 'success',
                data: null
            });
        });
        this.tableName = tableName;
    }
}
exports.BaseController = BaseController;
//# sourceMappingURL=baseController.js.map