"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../db");
const errorHandler_1 = require("../utils/errorHandler");
const baseController_1 = require("../utils/baseController");
class InvoiceController extends baseController_1.BaseController {
    constructor() {
        super('invoices');
        // Override getAll to include provider and items
        this.getAll = (0, errorHandler_1.catchAsync)(async (req, res) => {
            try {
                const result = await (0, db_1.query)(`
        SELECT 
          i.id,
          i.invoice_number,
          i.date,
          i.due_date,
          i.status,
          i.notes,
          i.tax_rate,
          i.provider_id,
          i.created_at,
          i.updated_at,
          COALESCE(p.name, 'Unknown Provider') as provider_name, 
          COALESCE(p.email, '') as provider_email,
          COALESCE(p.phone, '') as provider_phone,
          COALESCE(p.address, '') as provider_address,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', ii.id,
                  'product_id', ii.product_id,
                  'product_name', COALESCE(prod.name, 'Unknown Product'),
                  'product_description', COALESCE(prod.description, ''),
                  'reference', COALESCE(prod.reference, ''),
                  'sku', COALESCE(prod.sku, ''),
                  'category_id', COALESCE(prod.category_id, ''),
                  'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
                  'brand_id', COALESCE(prod.brand_id, ''),
                  'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
                  'quantity', COALESCE(ii.quantity, 0),
                  'unit_price', COALESCE(ii.unit_price, 0),
                  'discount', COALESCE(ii.discount, 0),
                  'total', COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)
                )
              ) 
              FROM invoice_items ii
              LEFT JOIN products prod ON ii.product_id = prod.id
              WHERE ii.invoice_id = i.id
            ),
            '[]'
          ) as items,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as subtotal,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as total
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        ORDER BY i.date DESC
      `);
                console.log("Invoice count:", result.rows.length);
                res.status(200).json({
                    status: 'success',
                    results: result.rows.length,
                    data: result.rows
                });
            }
            catch (error) {
                console.error("Error in getAll invoices:", error);
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to retrieve invoices',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // Override getById to include provider and items
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            try {
                const { id } = req.params;
                const result = await (0, db_1.query)(`
        SELECT 
          i.id,
          i.invoice_number,
          i.date,
          i.due_date,
          i.status,
          i.notes,
          i.tax_rate,
          i.provider_id,
          i.created_at,
          i.updated_at,
          COALESCE(p.name, 'Unknown Provider') as provider_name, 
          COALESCE(p.email, '') as provider_email,
          COALESCE(p.phone, '') as provider_phone,
          COALESCE(p.address, '') as provider_address,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', ii.id,
                  'product_id', ii.product_id,
                  'product_name', COALESCE(prod.name, 'Unknown Product'),
                  'product_description', COALESCE(prod.description, ''),
                  'reference', COALESCE(prod.reference, ''),
                  'sku', COALESCE(prod.sku, ''),
                  'category_id', COALESCE(prod.category_id, ''),
                  'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
                  'brand_id', COALESCE(prod.brand_id, ''),
                  'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
                  'quantity', COALESCE(ii.quantity, 0),
                  'unit_price', COALESCE(ii.unit_price, 0),
                  'discount', COALESCE(ii.discount, 0),
                  'total', COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)
                )
              ) 
              FROM invoice_items ii
              LEFT JOIN products prod ON ii.product_id = prod.id
              WHERE ii.invoice_id = i.id
            ),
            '[]'
          ) as items,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as subtotal,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as total
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = $1
      `, [id]);
                if (result.rows.length === 0) {
                    return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                console.error("Error in getById invoice:", error);
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to retrieve invoice',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
        // Override create to handle invoice items
        this.create = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { provider_id, date, due_date, status, notes, tax_rate, items } = req.body;
            console.log("=== Invoice Creation Debug ===");
            console.log("Received invoice data:", JSON.stringify(req.body, null, 2));
            console.log("Provider ID:", provider_id);
            console.log("Items:", JSON.stringify(items, null, 2));
            if (!items || !Array.isArray(items) || items.length === 0) {
                console.error("Invalid items format:", items);
                return next(new errorHandler_1.AppError('Invoice must contain at least one item', 400));
            }
            // Start a transaction
            console.log("Starting transaction");
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Check if provider exists
                let finalProviderId = provider_id;
                const providerResult = await (0, db_1.query)('SELECT id FROM providers WHERE id = $1', [provider_id]);
                if (providerResult.rows.length === 0) {
                    console.error("Provider not found, ID:", provider_id);
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Provider not found', 404));
                }
                else {
                    console.log("Provider exists in database");
                }
                // Generate invoice number
                const invoiceCount = await (0, db_1.query)('SELECT COUNT(*) FROM invoices');
                const invoiceNumber = `INV-${String(Number(invoiceCount.rows[0].count) + 1).padStart(5, '0')}`;
                console.log("Generated invoice number:", invoiceNumber);
                // Create invoice with defaults for missing fields
                const currentDate = new Date().toISOString().split('T')[0];
                console.log("Using date values:", {
                    date: date || currentDate,
                    due_date: due_date || null,
                    status: status || 'draft'
                });
                console.log("Inserting invoice with provider_id:", finalProviderId);
                const invoiceResult = await (0, db_1.query)(`
        INSERT INTO invoices (provider_id, invoice_number, date, due_date, status, notes, tax_rate)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [
                    finalProviderId,
                    invoiceNumber,
                    date || currentDate,
                    due_date || null,
                    status || 'draft',
                    notes || '',
                    tax_rate || 0
                ]);
                if (invoiceResult.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    console.error("Failed to insert invoice");
                    return next(new errorHandler_1.AppError('Failed to create invoice', 500));
                }
                const invoice = invoiceResult.rows[0];
                console.log("Created invoice:", invoice);
                // Create invoice items
                console.log("Processing invoice items");
                for (const item of items) {
                    // Verify product exists
                    const productResult = await (0, db_1.query)('SELECT id, price FROM products WHERE id = $1', [item.product_id]);
                    if (productResult.rows.length === 0) {
                        console.error("Product not found, ID:", item.product_id);
                        await (0, db_1.query)('ROLLBACK');
                        return next(new errorHandler_1.AppError(`Product not found: ${item.product_id}`, 404));
                    }
                    // Use provided unit price or fallback to product price
                    const unitPrice = item.unit_price || productResult.rows[0].price;
                    try {
                        console.log("Inserting invoice item:", {
                            invoice_id: invoice.id,
                            product_id: item.product_id,
                            quantity: item.quantity,
                            unit_price: unitPrice,
                            discount: item.discount || 0
                        });
                        await (0, db_1.query)(`
            INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount)
            VALUES ($1, $2, $3, $4, $5)
          `, [
                            invoice.id,
                            item.product_id,
                            item.quantity,
                            unitPrice,
                            item.discount || 0
                        ]);
                        console.log("Invoice item inserted successfully");
                        // Update product quantity if needed
                        if (item.update_inventory) {
                            console.log("Updating product inventory");
                            await (0, db_1.query)(`
              UPDATE products
              SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [item.quantity, item.product_id]);
                        }
                    }
                    catch (itemError) {
                        console.error("Error inserting invoice item:", itemError);
                        throw itemError;
                    }
                }
                // Commit the transaction
                console.log("Committing transaction");
                await (0, db_1.query)('COMMIT');
                // Get the invoice with all details
                console.log("Retrieving complete invoice data");
                const result = await (0, db_1.query)(`
        SELECT i.*, 
          p.name as provider_name, 
          p.email as provider_email,
          p.phone as provider_phone,
          p.address as provider_address,
          (
            SELECT COALESCE(json_agg(json_build_object(
              'id', ii.id,
              'product_id', ii.product_id,
              'product_name', COALESCE(prod.name, 'Unknown Product'),
              'product_description', COALESCE(prod.description, ''),
              'reference', COALESCE(prod.reference, ''),
              'sku', COALESCE(prod.sku, ''),
              'category_id', COALESCE(prod.category_id, ''),
              'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
              'brand_id', COALESCE(prod.brand_id, ''),
              'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
              'quantity', COALESCE(ii.quantity, 0),
              'unit_price', COALESCE(ii.unit_price, 0),
              'discount', COALESCE(ii.discount, 0),
              'total', (COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
            )), '[]')
            FROM invoice_items ii
            LEFT JOIN products prod ON ii.product_id = prod.id
            WHERE ii.invoice_id = i.id
          ) as items,
          COALESCE((
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ), 0) as subtotal,
          COALESCE((
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ), 0) as total
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = $1
      `, [invoice.id]);
                console.log("Sending response with invoice data");
                res.status(201).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                console.error("Invoice creation error:", error);
                // Provide more specific error messages based on the error type
                if (error instanceof Error) {
                    console.error('Invoice creation error details:', error.message);
                    // Handle foreign key constraint violations
                    if (error.message.includes('violates foreign key constraint')) {
                        if (error.message.includes('provider_id')) {
                            return next(new errorHandler_1.AppError('Invalid provider ID. The specified provider does not exist.', 400));
                        }
                        else if (error.message.includes('product_id')) {
                            return next(new errorHandler_1.AppError('Invalid product ID. One or more products do not exist.', 400));
                        }
                    }
                    // Handle unique constraint violations
                    if (error.message.includes('duplicate key') && error.message.includes('invoice_number')) {
                        return next(new errorHandler_1.AppError('An invoice with this number already exists. Please try again.', 400));
                    }
                    // Handle other database errors
                    if (error.message.includes('null value in column') && error.message.includes('violates not-null constraint')) {
                        return next(new errorHandler_1.AppError('Missing required fields for invoice creation.', 400));
                    }
                }
                return next(new errorHandler_1.AppError('Database query error.', 500));
            }
        });
        // Override update to handle invoice items
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { provider_id, date, due_date, status, notes, tax_rate, items } = req.body;
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Update invoice
                const updateFields = [];
                const updateValues = [];
                let valueCounter = 1;
                if (provider_id !== undefined) {
                    updateFields.push(`provider_id = $${valueCounter}`);
                    updateValues.push(provider_id);
                    valueCounter++;
                }
                if (date !== undefined) {
                    updateFields.push(`date = $${valueCounter}`);
                    updateValues.push(date);
                    valueCounter++;
                }
                if (due_date !== undefined) {
                    updateFields.push(`due_date = $${valueCounter}`);
                    updateValues.push(due_date);
                    valueCounter++;
                }
                if (status !== undefined) {
                    updateFields.push(`status = $${valueCounter}`);
                    updateValues.push(status);
                    valueCounter++;
                }
                if (notes !== undefined) {
                    updateFields.push(`notes = $${valueCounter}`);
                    updateValues.push(notes);
                    valueCounter++;
                }
                if (tax_rate !== undefined) {
                    updateFields.push(`tax_rate = $${valueCounter}`);
                    updateValues.push(tax_rate);
                    valueCounter++;
                }
                updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
                if (updateFields.length > 1) { // If there's more than just updated_at
                    updateValues.push(id);
                    const invoiceResult = await (0, db_1.query)(`
          UPDATE invoices
          SET ${updateFields.join(', ')}
          WHERE id = $${valueCounter}
          RETURNING *
        `, updateValues);
                    if (invoiceResult.rows.length === 0) {
                        await (0, db_1.query)('ROLLBACK');
                        return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                    }
                }
                // Handle items if they are provided
                if (items && Array.isArray(items)) {
                    // Get current items to compare
                    const currentItems = await (0, db_1.query)('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
                    // Map of current items by ID for easy lookup
                    const currentItemsMap = new Map();
                    currentItems.rows.forEach(item => {
                        currentItemsMap.set(item.id, item);
                    });
                    // Process items
                    for (const item of items) {
                        if (item.id) {
                            // Update existing item
                            if (currentItemsMap.has(item.id)) {
                                await (0, db_1.query)(`
                UPDATE invoice_items
                SET product_id = $1, quantity = $2, unit_price = $3, discount = $4, updated_at = CURRENT_TIMESTAMP
                WHERE id = $5
              `, [item.product_id, item.quantity, item.unit_price, item.discount, item.id]);
                                // Remove from map to track which ones are processed
                                currentItemsMap.delete(item.id);
                            }
                        }
                        else {
                            // Create new item
                            await (0, db_1.query)(`
              INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount)
              VALUES ($1, $2, $3, $4, $5)
            `, [id, item.product_id, item.quantity, item.unit_price, item.discount]);
                        }
                        // Update product quantity if needed
                        if (item.update_inventory) {
                            await (0, db_1.query)(`
              UPDATE products
              SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
              WHERE id = $2
            `, [item.quantity, item.product_id]);
                        }
                    }
                    // Delete items that weren't in the update (if itemsToRemove is provided)
                    if (req.body.removeUnlistedItems === true) {
                        for (const [itemId] of currentItemsMap) {
                            await (0, db_1.query)('DELETE FROM invoice_items WHERE id = $1', [itemId]);
                        }
                    }
                }
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the updated invoice with all details
                const updatedResult = await (0, db_1.query)(`
        SELECT i.*, 
          COALESCE(p.name, 'Unknown Provider') as provider_name, 
          COALESCE(p.email, '') as provider_email,
          COALESCE(p.phone, '') as provider_phone,
          COALESCE(p.address, '') as provider_address,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', ii.id,
                  'product_id', ii.product_id,
                  'product_name', COALESCE(prod.name, 'Unknown Product'),
                  'product_description', COALESCE(prod.description, ''),
                  'reference', COALESCE(prod.reference, ''),
                  'sku', COALESCE(prod.sku, ''),
                  'category_id', COALESCE(prod.category_id, ''),
                  'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
                  'brand_id', COALESCE(prod.brand_id, ''),
                  'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
                  'quantity', COALESCE(ii.quantity, 0),
                  'unit_price', COALESCE(ii.unit_price, 0),
                  'discount', COALESCE(ii.discount, 0),
                  'total', COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)
                )
              )
              FROM invoice_items ii
              LEFT JOIN products prod ON ii.product_id = prod.id
              WHERE ii.invoice_id = i.id
            ),
            '[]'
          ) as items,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as subtotal,
          COALESCE(
            (
              SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
              FROM invoice_items ii
              WHERE ii.invoice_id = i.id
            ),
            0
          ) as total
        FROM invoices i
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = $1
      `, [id]);
                if (updatedResult.rows.length === 0) {
                    return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: updatedResult.rows[0]
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                throw error;
            }
        });
        // Override delete to handle invoice items
        this.delete = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            // Start a transaction
            const client = await (0, db_1.query)('BEGIN');
            try {
                // Check if invoice exists
                const invoiceCheck = await (0, db_1.query)('SELECT id FROM invoices WHERE id = $1', [id]);
                if (invoiceCheck.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                }
                // Delete invoice items (would be handled by ON DELETE CASCADE, but we're being explicit)
                await (0, db_1.query)('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);
                // Delete invoice
                await (0, db_1.query)('DELETE FROM invoices WHERE id = $1', [id]);
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                res.status(200).json({
                    status: 'success',
                    data: null
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                throw error;
            }
        });
        // Get invoices by status
        this.getByStatus = (0, errorHandler_1.catchAsync)(async (req, res) => {
            const { status } = req.params;
            const result = await (0, db_1.query)(`
      SELECT i.*, 
        COALESCE(p.name, 'Unknown Provider') as provider_name, 
        COALESCE(p.email, '') as provider_email,
        COALESCE(p.phone, '') as provider_phone,
        COALESCE(p.address, '') as provider_address,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', ii.id,
                'product_id', ii.product_id,
                'product_name', COALESCE(prod.name, 'Unknown Product'),
                'product_description', COALESCE(prod.description, ''),
                'reference', COALESCE(prod.reference, ''),
                'sku', COALESCE(prod.sku, ''),
                'category_id', COALESCE(prod.category_id, ''),
                'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
                'brand_id', COALESCE(prod.brand_id, ''),
                'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
                'quantity', COALESCE(ii.quantity, 0),
                'unit_price', COALESCE(ii.unit_price, 0),
                'discount', COALESCE(ii.discount, 0),
                'total', COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)
              )
            )
            FROM invoice_items ii
            LEFT JOIN products prod ON ii.product_id = prod.id
            WHERE ii.invoice_id = i.id
          ),
          '[]'
        ) as items,
        COALESCE(
          (
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ),
          0
        ) as subtotal,
        COALESCE(
          (
            SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
            FROM invoice_items ii
            WHERE ii.invoice_id = i.id
          ),
          0
        ) as total
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      WHERE i.status = $1
      ORDER BY i.date DESC
    `, [status]);
            res.status(200).json({
                status: 'success',
                results: result.rows.length,
                data: result.rows
            });
        });
        // Update invoice status
        this.updateStatus = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { status } = req.body;
            if (!status) {
                return next(new errorHandler_1.AppError('Status is required', 400));
            }
            // Validate status
            const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
            if (!validStatuses.includes(status)) {
                return next(new errorHandler_1.AppError(`Status must be one of: ${validStatuses.join(', ')}`, 400));
            }
            const result = await (0, db_1.query)(`
      UPDATE invoices
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `, [status, id]);
            if (result.rows.length === 0) {
                return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
            }
            // Get the updated invoice with all details
            const updatedResult = await (0, db_1.query)(`
      SELECT i.*, 
        p.name as provider_name, 
        p.email as provider_email,
        p.phone as provider_phone,
        p.address as provider_address,
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id', ii.id,
            'product_id', ii.product_id,
            'product_name', COALESCE(prod.name, 'Unknown Product'),
            'product_description', COALESCE(prod.description, ''),
            'reference', COALESCE(prod.reference, ''),
            'sku', COALESCE(prod.sku, ''),
            'category_id', COALESCE(prod.category_id, ''),
            'category_name', COALESCE((SELECT name FROM categories WHERE id = prod.category_id), 'Uncategorized'),
            'brand_id', COALESCE(prod.brand_id, ''),
            'brand_name', COALESCE((SELECT name FROM brands WHERE id = prod.brand_id), 'Unbranded'),
            'quantity', COALESCE(ii.quantity, 0),
            'unit_price', COALESCE(ii.unit_price, 0),
            'discount', COALESCE(ii.discount, 0),
            'total', (COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
          )), '[]')
          FROM invoice_items ii
          LEFT JOIN products prod ON ii.product_id = prod.id
          WHERE ii.invoice_id = i.id
        ) as items,
        COALESCE((
          SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100))
          FROM invoice_items ii
          WHERE ii.invoice_id = i.id
        ), 0) as subtotal,
        COALESCE((
          SELECT SUM(COALESCE(ii.quantity, 0) * COALESCE(ii.unit_price, 0) * (1 - COALESCE(ii.discount, 0) / 100)) * (1 + COALESCE(i.tax_rate, 0) / 100)
          FROM invoice_items ii
          WHERE ii.invoice_id = i.id
        ), 0) as total
      FROM invoices i
      LEFT JOIN providers p ON i.provider_id = p.id
      WHERE i.id = $1
    `, [id]);
            res.status(200).json({
                status: 'success',
                data: updatedResult.rows[0]
            });
        });
    }
}
exports.default = new InvoiceController();
//# sourceMappingURL=invoiceController.js.map