"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const baseController_1 = require("../utils/baseController");
const errorHandler_1 = require("../utils/errorHandler");
const db_1 = __importDefault(require("../db"));
const fileParser_1 = require("../utils/fileParser");
class CategoryController extends baseController_1.BaseController {
    constructor() {
        super('product_categories');
        // Add a new method for bulk upload
        this.bulkCreate = (0, errorHandler_1.catchAsync)(async (req, res) => {
            // Ensure file was uploaded
            if (!req.file) {
                return res.status(400).json({
                    status: 'error',
                    message: 'No file uploaded'
                });
            }
            try {
                // Parse the file
                const categories = await (0, fileParser_1.parseFile)(req.file);
                // Insert categories in a transaction
                const client = await db_1.default.connect();
                try {
                    await client.query('BEGIN');
                    const results = [];
                    const duplicates = [];
                    for (const category of categories) {
                        // Check if category already exists
                        const checkResult = await client.query(`SELECT * FROM ${this.tableName} WHERE name = $1`, [category.name]);
                        if (checkResult.rows.length > 0) {
                            duplicates.push(category.name);
                            continue;
                        }
                        // Insert the new category
                        const result = await client.query(`INSERT INTO ${this.tableName} (name, description) VALUES ($1, $2) RETURNING *`, [category.name, category.description || '']);
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
                }
                catch (error) {
                    await client.query('ROLLBACK');
                    throw error;
                }
                finally {
                    client.release();
                }
            }
            catch (error) {
                return res.status(400).json({
                    status: 'error',
                    message: `Failed to process file: ${error.message}`
                });
            }
        });
    }
}
exports.default = new CategoryController();
//# sourceMappingURL=categoryController.js.map