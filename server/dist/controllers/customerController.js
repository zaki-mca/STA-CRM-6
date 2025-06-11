"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCustomer = exports.updateCustomer = exports.createCustomer = exports.getCustomerById = exports.getAllCustomers = void 0;
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
// Get all customers
exports.getAllCustomers = (0, errorHandler_1.catchAsync)(async (req, res) => {
    const result = await (0, db_1.query)('SELECT * FROM customers ORDER BY created_at DESC');
    res.status(200).json({
        status: 'success',
        results: result.rows.length,
        data: result.rows
    });
});
// Get a single customer by ID
exports.getCustomerById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const result = await (0, db_1.query)('SELECT * FROM customers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
        return next(new errorHandler_1.AppError('Customer not found', 404));
    }
    res.status(200).json({
        status: 'success',
        data: result.rows[0]
    });
});
// Create a new customer
exports.createCustomer = (0, errorHandler_1.catchAsync)(async (req, res) => {
    const { name, email, phone, company, status, notes } = req.body;
    const result = await (0, db_1.query)('INSERT INTO customers (name, email, phone, company, status, notes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', [name, email, phone, company, status || 'lead', notes]);
    res.status(201).json({
        status: 'success',
        data: result.rows[0]
    });
});
// Update an existing customer
exports.updateCustomer = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { name, email, phone, company, status, notes } = req.body;
    // First check if the customer exists
    const checkResult = await (0, db_1.query)('SELECT * FROM customers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
        return next(new errorHandler_1.AppError('Customer not found', 404));
    }
    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramIndex = 1;
    if (name) {
        updates.push(`name = $${paramIndex}`);
        values.push(name);
        paramIndex++;
    }
    if (email) {
        updates.push(`email = $${paramIndex}`);
        values.push(email);
        paramIndex++;
    }
    if (phone !== undefined) {
        updates.push(`phone = $${paramIndex}`);
        values.push(phone);
        paramIndex++;
    }
    if (company !== undefined) {
        updates.push(`company = $${paramIndex}`);
        values.push(company);
        paramIndex++;
    }
    if (status) {
        updates.push(`status = $${paramIndex}`);
        values.push(status);
        paramIndex++;
    }
    if (notes !== undefined) {
        updates.push(`notes = $${paramIndex}`);
        values.push(notes);
        paramIndex++;
    }
    // Add updated_at timestamp
    updates.push(`updated_at = NOW()`);
    // If no fields to update, return the existing customer
    if (updates.length === 1) {
        return res.status(200).json({
            status: 'success',
            data: checkResult.rows[0]
        });
    }
    values.push(id);
    const updateQuery = `
    UPDATE customers 
    SET ${updates.join(', ')} 
    WHERE id = $${paramIndex} 
    RETURNING *
  `;
    const result = await (0, db_1.query)(updateQuery, values);
    res.status(200).json({
        status: 'success',
        data: result.rows[0]
    });
});
// Delete a customer
exports.deleteCustomer = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    // First check if the customer exists
    const checkResult = await (0, db_1.query)('SELECT * FROM customers WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
        return next(new errorHandler_1.AppError('Customer not found', 404));
    }
    await (0, db_1.query)('DELETE FROM customers WHERE id = $1', [id]);
    res.status(204).json({
        status: 'success',
        data: null
    });
});
//# sourceMappingURL=customerController.js.map