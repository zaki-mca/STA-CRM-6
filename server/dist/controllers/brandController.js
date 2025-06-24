"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const baseController_1 = require("../utils/baseController");
const errorHandler_1 = require("../utils/errorHandler");
const fileParser_1 = require("../utils/fileParser");
const db_1 = require("../db");
class BrandController extends baseController_1.BaseController {
    constructor() {
        super('product_brands');
        this.bulkUpload = (0, errorHandler_1.catchAsync)(async (req, res) => {
            if (!req.file) {
                throw new errorHandler_1.AppError('No file uploaded', 400);
            }
            try {
                // Parse the uploaded file using the unified file parser
                const validRecords = await (0, fileParser_1.parseFile)(req.file);
                if (validRecords.length === 0) {
                    throw new errorHandler_1.AppError('No valid brand records found in file', 400);
                }
                // Insert records into database
                const insertedItems = [];
                for (const record of validRecords) {
                    // Check if brand already exists
                    const existingBrand = await (0, db_1.query)(`SELECT * FROM ${this.tableName} WHERE name = $1`, [record.name]);
                    if (existingBrand.rows.length === 0) {
                        // Insert new brand
                        const result = await (0, db_1.query)(`INSERT INTO ${this.tableName} (name) VALUES ($1) RETURNING *`, [record.name]);
                        insertedItems.push(result.rows[0]);
                    }
                }
                res.status(200).json({
                    status: 'success',
                    message: `${insertedItems.length} brands imported successfully`,
                    items: insertedItems
                });
            }
            catch (error) {
                throw new errorHandler_1.AppError(`Error processing file: ${error.message}`, 400);
            }
        });
    }
}
exports.default = new BrandController();
//# sourceMappingURL=brandController.js.map