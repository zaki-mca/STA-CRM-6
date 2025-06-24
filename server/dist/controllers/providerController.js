"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class ProviderController extends baseController_1.BaseController {
    constructor() {
        super('providers');
        // Override create method to provide better error messages
        this.create = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { name, email, phone, address, contact_person, notes, status } = req.body;
            try {
                // Check if provider with this email already exists
                const existingProvider = await (0, db_1.query)('SELECT id FROM providers WHERE email = $1', [email]);
                if (existingProvider.rows.length > 0) {
                    return next(new errorHandler_1.AppError(`Duplicate entry: Key (email)=(${email}) already exists.`, 400));
                }
                // If no duplicate, proceed with creation
                const result = await (0, db_1.query)(`INSERT INTO providers (name, email, phone, address, contact_person, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`, [name, email, phone, address, contact_person || '', notes || '', status || 'active']);
                res.status(201).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (err) {
                // If it's a database unique constraint error, convert it to a more user-friendly error
                if (err.code === '23505') { // PostgreSQL unique violation code
                    return next(new errorHandler_1.AppError(`Duplicate entry: Provider with email ${email} already exists.`, 400));
                }
                // For other errors, pass them through
                next(err);
            }
        });
        // Override getAll to include all provider fields
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const result = await (0, db_1.query)(`
      SELECT * FROM providers
      ORDER BY created_at DESC
    `);
            // Ensure all providers have the required fields
            const providers = result.rows.map((provider) => ({
                ...provider,
                // Ensure these fields are never null/undefined for the frontend
                name: provider.name || '',
                email: provider.email || '',
                phone: provider.phone || '',
                address: provider.address || '',
                contact_person: provider.contact_person || '',
                notes: provider.notes || '',
                status: provider.status || 'active'
            }));
            // Debug: Log the number of providers
            console.log(`Sending ${providers.length} providers to frontend`);
            res.status(200).json({
                status: 'success',
                results: providers.length,
                data: providers
            });
        });
        // Override getById to include all provider fields
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const result = await (0, db_1.query)(`
      SELECT * FROM providers
      WHERE id = $1
    `, [id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Provider not found with this ID', 404));
            }
            // Ensure the provider has all required fields
            const providerRow = result.rows[0];
            const provider = {
                ...providerRow,
                // Ensure these fields are never null/undefined for the frontend
                name: providerRow.name || '',
                email: providerRow.email || '',
                phone: providerRow.phone || '',
                address: providerRow.address || '',
                contact_person: providerRow.contact_person || '',
                notes: providerRow.notes || '',
                status: providerRow.status || 'active'
            };
            res.status(200).json({
                status: 'success',
                data: provider
            });
        });
        // Get products by provider
        this.getProviderProducts = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // First check if provider exists
            const providerCheck = await (0, db_1.query)('SELECT id FROM providers WHERE id = $1', [id]);
            if (providerCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Provider not found with this ID', 404));
            }
            // Assuming products have a provider_id field or you have a provider_products junction table
            // We'll need to modify the query based on your actual database schema
            const result = await (0, db_1.query)(`
      SELECT p.* 
      FROM products p
      WHERE p.provider_id = $1
      ORDER BY p.name
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Get orders for a provider
        this.getProviderOrders = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // First check if provider exists
            const providerCheck = await (0, db_1.query)('SELECT id FROM providers WHERE id = $1', [id]);
            if (providerCheck.rows.length === 0) {
                return next(new errorHandler_1.AppError('Provider not found with this ID', 404));
            }
            // This would depend on your schema - if orders have a provider_id or if you need to join through products
            const result = await (0, db_1.query)(`
      SELECT DISTINCT o.* 
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE p.provider_id = $1
      ORDER BY o.order_date DESC
    `, [id]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
    }
}
exports.default = new ProviderController();
//# sourceMappingURL=providerController.js.map