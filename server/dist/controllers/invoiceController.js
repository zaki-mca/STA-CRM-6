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
                console.log("Fetching all invoices");
                // First, get the basic invoice data
                const invoicesResult = await (0, db_1.query)(`
        SELECT 
          i.id::text as id,
          i.invoice_number,
          i.date,
          i.due_date,
          i.status,
          i.notes,
          i.tax_rate,
          i.client_id::text as client_id,
          i.provider_id::text as provider_id,
          i.created_at,
          i.updated_at
        FROM invoices i
        ORDER BY i.date DESC
      `);
                console.log(`Fetched ${invoicesResult.rows?.length || 0} invoices`);
                if (!invoicesResult.rows || invoicesResult.rows.length === 0) {
                    return res.status(200).json({
                        status: 'success',
                        results: 0,
                        data: []
                    });
                }
                // Create a map of invoices for quick lookup
                const invoiceMap = new Map();
                invoicesResult.rows.forEach((row) => {
                    invoiceMap.set(row.id, {
                        ...row,
                        items: [],
                        subtotal: 0,
                        total: 0
                    });
                });
                // Get client and provider info separately
                const clientsResult = await (0, db_1.query)(`
        SELECT c.id::text as id, c.name, c.email, c.phone, c.address
        FROM clients c
        WHERE c.id IN (
          SELECT DISTINCT client_id FROM invoices WHERE client_id IS NOT NULL
        )
      `);
                const providersResult = await (0, db_1.query)(`
        SELECT p.id::text as id, p.name, p.email, p.phone, p.address
        FROM providers p
        WHERE p.id IN (
          SELECT DISTINCT provider_id FROM invoices WHERE provider_id IS NOT NULL
        )
      `);
                // Create maps for clients and providers
                const clientMap = new Map();
                clientsResult.rows.forEach((client) => {
                    clientMap.set(client.id, client);
                });
                const providerMap = new Map();
                providersResult.rows.forEach((provider) => {
                    providerMap.set(provider.id, provider);
                });
                // Add client and provider info to invoices
                for (const invoice of invoiceMap.values()) {
                    if (invoice.client_id && clientMap.has(invoice.client_id)) {
                        const client = clientMap.get(invoice.client_id);
                        invoice.client_name = client.name;
                        invoice.client_email = client.email;
                        invoice.client_phone = client.phone;
                        invoice.client_address = client.address;
                    }
                    if (invoice.provider_id && providerMap.has(invoice.provider_id)) {
                        const provider = providerMap.get(invoice.provider_id);
                        invoice.provider_name = provider.name;
                        invoice.provider_email = provider.email;
                        invoice.provider_phone = provider.phone;
                        invoice.provider_address = provider.address;
                    }
                }
                // Now fetch all invoice items separately
                const itemsResult = await (0, db_1.query)(`
        SELECT 
          ii.id::text as id,
          ii.invoice_id::text as invoice_id,
          ii.product_id::text as product_id,
          ii.quantity,
          ii.unit_price,
          ii.discount,
          p.name as product_name,
          p.description as product_description,
          p.reference,
          p.sku,
          p.category_id::text as category_id,
          pc.name as category_name,
          p.brand_id::text as brand_id,
          pb.name as brand_name,
          (ii.quantity * ii.unit_price * (1 - (ii.discount / 100))) as total
        FROM invoice_items ii
        LEFT JOIN products p ON ii.product_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN product_brands pb ON p.brand_id = pb.id
      `);
                // Add items to their respective invoices and calculate totals
                for (const item of itemsResult.rows) {
                    const invoiceId = item.invoice_id;
                    if (invoiceMap.has(invoiceId)) {
                        const invoice = invoiceMap.get(invoiceId);
                        // Add item to invoice
                        invoice.items.push(item);
                        // Update subtotal
                        const itemTotal = parseFloat(item.total) || 0;
                        invoice.subtotal += itemTotal;
                        // Update total with tax
                        invoice.total = invoice.subtotal * (1 + (parseFloat(invoice.tax_rate) || 0) / 100);
                    }
                }
                // Convert the map back to an array
                const invoices = Array.from(invoiceMap.values());
                console.log("Successfully retrieved invoices. Count:", invoices.length);
                res.status(200).json({
                    status: 'success',
                    results: invoices.length,
                    data: invoices
                });
            }
            catch (error) {
                console.error("Error in getAll invoices:", error);
                let errorMessage = 'Failed to retrieve invoices';
                if (error instanceof Error) {
                    errorMessage = error.message;
                    console.error("Full error details:", error.stack);
                }
                res.status(500).json({
                    status: 'error',
                    message: errorMessage
                });
            }
        });
        // Override getById to include provider and items
        this.getById = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            try {
                const { id } = req.params;
                console.log(`Fetching invoice with ID: ${id}`);
                // First, get the invoice with basic client and provider information
                const invoiceResult = await (0, db_1.query)(`
        SELECT 
          i.id,
          i.invoice_number,
          i.date,
          i.due_date,
          i.status,
          i.notes,
          i.tax_rate,
          i.client_id,
          i.provider_id,
          i.created_at,
          i.updated_at,
          COALESCE(c.name, '') as client_name, 
          COALESCE(c.email, '') as client_email,
          COALESCE(c.phone, '') as client_phone,
          COALESCE(c.address, '') as client_address,
          COALESCE(p.name, '') as provider_name, 
          COALESCE(p.email, '') as provider_email,
          COALESCE(p.phone, '') as provider_phone,
          COALESCE(p.address, '') as provider_address
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN providers p ON i.provider_id = p.id
        WHERE i.id = $1
      `, [id]);
                if (!invoiceResult.rows.length) {
                    return next(new errorHandler_1.AppError(`No invoice found with ID: ${id}`, 404));
                }
                // Create the invoice object
                const invoiceRow = invoiceResult.rows[0];
                const invoice = {
                    id: invoiceRow.id,
                    invoice_number: invoiceRow.invoice_number,
                    date: invoiceRow.date,
                    due_date: invoiceRow.due_date,
                    status: invoiceRow.status,
                    notes: invoiceRow.notes,
                    tax_rate: invoiceRow.tax_rate,
                    client_id: invoiceRow.client_id,
                    client_name: invoiceRow.client_name,
                    client_email: invoiceRow.client_email,
                    client_phone: invoiceRow.client_phone,
                    client_address: invoiceRow.client_address,
                    provider_id: invoiceRow.provider_id,
                    provider_name: invoiceRow.provider_name,
                    provider_email: invoiceRow.provider_email,
                    provider_phone: invoiceRow.provider_phone,
                    provider_address: invoiceRow.provider_address,
                    created_at: invoiceRow.created_at,
                    updated_at: invoiceRow.updated_at,
                    items: [],
                    subtotal: 0,
                    total: 0
                };
                try {
                    // Get invoice items
                    const itemsResult = await (0, db_1.query)(`
          SELECT 
            ii.id,
            ii.invoice_id,
            ii.product_id,
            ii.quantity,
            ii.unit_price,
            ii.discount,
            COALESCE(prod.name, 'Unknown Product') as product_name,
            COALESCE(prod.description, '') as product_description,
            COALESCE(prod.reference, '') as reference,
            COALESCE(prod.sku, '') as sku,
            COALESCE(prod.category_id, '') as category_id,
            COALESCE((SELECT pc.name FROM product_categories pc WHERE pc.id = prod.category_id), 'Uncategorized') as category_name,
            COALESCE(prod.brand_id, '') as brand_id,
            COALESCE((SELECT pb.name FROM product_brands pb WHERE pb.id = prod.brand_id), 'Unbranded') as brand_name
          FROM invoice_items ii
          LEFT JOIN products prod ON ii.product_id = prod.id
          WHERE ii.invoice_id = $1
        `, [id]);
                    // Process items
                    for (const item of itemsResult.rows) {
                        // Calculate item total
                        const itemTotal = item.quantity * item.unit_price * (1 - (item.discount || 0) / 100);
                        // Add item to invoice
                        const invoiceItem = {
                            id: item.id,
                            product_id: item.product_id,
                            product_name: item.product_name,
                            product_description: item.product_description,
                            reference: item.reference,
                            sku: item.sku,
                            category_id: item.category_id,
                            category_name: item.category_name,
                            brand_id: item.brand_id,
                            brand_name: item.brand_name,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            discount: item.discount,
                            total: itemTotal
                        };
                        invoice.items.push(invoiceItem);
                        // Update invoice subtotal
                        invoice.subtotal += itemTotal;
                    }
                }
                catch (itemsError) {
                    console.error("Error fetching invoice items:", itemsError);
                    console.log("Continuing with basic invoice data without items");
                }
                // Calculate final total
                invoice.total = invoice.subtotal * (1 + (invoice.tax_rate || 0) / 100);
                console.log(`Successfully retrieved invoice with ID: ${id}`);
                res.status(200).json({
                    status: 'success',
                    data: invoice
                });
            }
            catch (error) {
                console.error(`Error in getById invoice (ID: ${req.params.id}):`, error);
                next(error);
            }
        });
        // Override create to handle invoice items
        this.create = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            try {
                const { client_id, provider_id, items, ...rest } = req.body;
                console.log("Creating invoice with data:", { client_id, provider_id, items, ...rest });
                // Validate either client_id or provider_id is provided but not both
                if (!client_id && !provider_id) {
                    return next(new errorHandler_1.AppError('Either client_id or provider_id must be provided', 400));
                }
                if (client_id && provider_id) {
                    return next(new errorHandler_1.AppError('Cannot specify both client_id and provider_id', 400));
                }
                // Validate items exist and are properly formatted
                if (!items || !Array.isArray(items) || items.length === 0) {
                    return next(new errorHandler_1.AppError('At least one invoice item is required', 400));
                }
                // Start a transaction
                await (0, db_1.query)('BEGIN');
                // Check if entity (provider or client) exists and get UUID if needed
                let entityTable = provider_id ? 'providers' : 'clients';
                let entityIdParam = provider_id || client_id;
                let entityId = '';
                let isUuid = false;
                // Check if it's a UUID format
                const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
                if (entityIdParam && uuidRegex.test(entityIdParam)) {
                    isUuid = true;
                    entityId = entityIdParam;
                }
                // If not UUID, try to find by regular ID
                let entityResult;
                console.log(`Looking for ${entityTable} with ID: ${entityIdParam}, format is ${isUuid ? 'UUID' : 'non-UUID'}`);
                try {
                    // First, check the column type from the database schema
                    const schemaResult = await (0, db_1.query)(`
          SELECT data_type 
          FROM information_schema.columns 
          WHERE table_name = $1 
          AND column_name = 'id'
        `, [entityTable]);
                    const idColumnType = schemaResult.rows[0]?.data_type || 'uuid';
                    console.log(`ID column type for ${entityTable} is: ${idColumnType}`);
                    if (isUuid) {
                        // Direct UUID comparison for UUID inputs
                        entityResult = await (0, db_1.query)(`SELECT id FROM ${entityTable} WHERE id = $1`, [entityId]);
                    }
                    else if (idColumnType === 'uuid') {
                        // Try UUID cast for UUID columns
                        try {
                            entityResult = await (0, db_1.query)(`SELECT id FROM ${entityTable} WHERE id = $1::uuid`, [entityIdParam]);
                        }
                        catch (e) {
                            // Fallback if UUID cast fails
                            entityResult = { rows: [] };
                        }
                    }
                    else if (idColumnType === 'integer' || idColumnType === 'bigint') {
                        // For integer ID columns
                        if (!isNaN(Number(entityIdParam))) {
                            entityResult = await (0, db_1.query)(`SELECT id FROM ${entityTable} WHERE id = $1`, [Number(entityIdParam)]);
                        }
                        else {
                            entityResult = { rows: [] };
                        }
                    }
                    else {
                        // For other types, try direct comparison
                        entityResult = await (0, db_1.query)(`SELECT id FROM ${entityTable} WHERE id = $1`, [entityIdParam]);
                    }
                    console.log(`Entity lookup result:`, entityResult.rows);
                }
                catch (error) {
                    console.error(`Error looking up ${entityTable}:`, error instanceof Error ? error.message : String(error));
                    entityResult = { rows: [] };
                }
                if (entityResult.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError(`${provider_id ? 'Provider' : 'Client'} not found with ID: ${entityIdParam}`, 404));
                }
                // Use the actual UUID from the database
                entityId = entityResult.rows[0].id;
                console.log(`Found ${entityTable} with ID:`, entityId);
                // Generate invoice number if not provided
                const invoiceNumber = rest.invoice_number || `INV-${Date.now()}`;
                const currentDate = new Date().toISOString().split('T')[0];
                // Create invoice query params
                const params = [];
                let insertQuery = 'INSERT INTO invoices (';
                let valuesQuery = 'VALUES (';
                // Handle client_id or provider_id
                if (client_id) {
                    insertQuery += 'client_id, ';
                    valuesQuery += '$' + (params.length + 1) + ', ';
                    params.push(entityId); // Using the validated UUID from the database
                }
                else {
                    insertQuery += 'provider_id, ';
                    valuesQuery += '$' + (params.length + 1) + ', ';
                    params.push(entityId); // Using the validated UUID from the database
                }
                // Add other invoice fields
                insertQuery += 'invoice_number, date, due_date, status, notes, tax_rate) ';
                valuesQuery += '$' + (params.length + 1) + ', ';
                params.push(invoiceNumber);
                valuesQuery += '$' + (params.length + 1) + ', ';
                params.push(rest.date || currentDate);
                valuesQuery += '$' + (params.length + 1) + ', ';
                params.push(rest.due_date || null);
                valuesQuery += '$' + (params.length + 1) + ', ';
                params.push(rest.status || 'draft');
                valuesQuery += '$' + (params.length + 1) + ', ';
                params.push(rest.notes || '');
                valuesQuery += '$' + (params.length + 1) + ') ';
                params.push(rest.tax_rate || 0);
                // Complete query
                const fullQuery = insertQuery + valuesQuery + 'RETURNING *';
                console.log("Invoice creation query:", fullQuery);
                console.log("Parameters:", params);
                // Insert invoice
                const invoiceResult = await (0, db_1.query)(fullQuery, params);
                const invoice = invoiceResult.rows[0];
                console.log("Created invoice:", invoice);
                // Create invoice items
                for (const item of items) {
                    // Verify product exists
                    const productResult = await (0, db_1.query)('SELECT id, price FROM products WHERE id = $1', [item.product_id]);
                    if (productResult.rows.length === 0) {
                        await (0, db_1.query)('ROLLBACK');
                        return next(new errorHandler_1.AppError(`Product not found: ${item.product_id}`, 404));
                    }
                    // Use provided unit price or fallback to product price
                    const unitPrice = item.unit_price !== undefined ? item.unit_price : productResult.rows[0].price;
                    // Insert invoice item
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
                    // Update product quantity if needed
                    if (item.update_inventory) {
                        await (0, db_1.query)(`
            UPDATE products
            SET quantity = GREATEST(0, quantity - $1), updated_at = CURRENT_TIMESTAMP
            WHERE id = $2
          `, [item.quantity, item.product_id]);
                    }
                }
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the complete invoice with items
                const result = await (0, db_1.query)(`
        SELECT 
          i.*,
          CASE 
            WHEN i.client_id IS NOT NULL THEN 
              (SELECT row_to_json(c) FROM (SELECT name, email, phone, address FROM clients WHERE id = i.client_id) c)
            ELSE NULL 
          END as client,
          CASE 
            WHEN i.provider_id IS NOT NULL THEN 
              (SELECT row_to_json(p) FROM (SELECT name, email, phone, address FROM providers WHERE id = i.provider_id) p)
            ELSE NULL 
          END as provider,
          (
            SELECT json_agg(ii_data) FROM (
              SELECT 
                ii.*, 
                p.name as product_name,
                p.description as product_description,
                p.reference,
                p.sku,
                pc.name as category_name,
                pb.name as brand_name,
                (ii.quantity * ii.unit_price * (1 - ii.discount / 100)) as total
              FROM invoice_items ii
              LEFT JOIN products p ON ii.product_id = p.id
              LEFT JOIN product_categories pc ON p.category_id = pc.id
              LEFT JOIN product_brands pb ON p.brand_id = pb.id
              WHERE ii.invoice_id = i.id
            ) ii_data
          ) as items
        FROM invoices i
        WHERE i.id = $1
      `, [invoice.id]);
                // Format the response
                const invoiceData = result.rows[0];
                const formattedInvoice = {
                    ...invoiceData,
                    client_name: invoiceData.client?.name || '',
                    client_email: invoiceData.client?.email || '',
                    client_phone: invoiceData.client?.phone || '',
                    client_address: invoiceData.client?.address || '',
                    provider_name: invoiceData.provider?.name || '',
                    provider_email: invoiceData.provider?.email || '',
                    provider_phone: invoiceData.provider?.phone || '',
                    provider_address: invoiceData.provider?.address || '',
                    items: invoiceData.items || [],
                    subtotal: (invoiceData.items || []).reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0),
                };
                formattedInvoice.total = formattedInvoice.subtotal * (1 + (parseFloat(formattedInvoice.tax_rate) || 0) / 100);
                res.status(201).json({
                    status: 'success',
                    data: formattedInvoice
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                // Type assertion using our DatabaseError interface
                const dbError = error;
                console.error("Complete database error during invoice creation:", {
                    message: dbError.message,
                    stack: dbError.stack,
                    code: dbError.code,
                    detail: dbError.detail,
                    constraint: dbError.constraint,
                    table: dbError.table,
                    column: dbError.column
                });
                // Handle specific database errors
                if (dbError.code === '23503') { // Foreign key violation
                    return next(new errorHandler_1.AppError(`Referenced entity not found: ${dbError.detail}`, 400));
                }
                else if (dbError.code === '23505') { // Unique violation
                    return next(new errorHandler_1.AppError(`Duplicate value: ${dbError.detail}`, 400));
                }
                else if (dbError.code === '23514') { // Check violation
                    return next(new errorHandler_1.AppError(`Constraint violation: ${dbError.constraint} - ${dbError.detail}`, 400));
                }
                return next(new errorHandler_1.AppError(`Database error: ${dbError.message}`, 500));
            }
        });
        // Override update to handle invoice items
        this.update = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            const { id } = req.params;
            const { provider_id, client_id, date, due_date, status, notes, tax_rate, items } = req.body;
            console.log("Updating invoice:", { id, provider_id, client_id, items });
            // Start a transaction
            await (0, db_1.query)('BEGIN');
            try {
                // Check if invoice exists
                const invoiceCheck = await (0, db_1.query)('SELECT * FROM invoices WHERE id = $1', [id]);
                if (invoiceCheck.rows.length === 0) {
                    await (0, db_1.query)('ROLLBACK');
                    return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                }
                // Update invoice
                const updateFields = [];
                const updateValues = [];
                let valueCounter = 1;
                if (provider_id !== undefined) {
                    // Only add provider_id if it's a valid value
                    if (provider_id) {
                        updateFields.push(`provider_id = $${valueCounter}`);
                        updateValues.push(provider_id);
                        valueCounter++;
                    }
                    else {
                        // Set to NULL if empty
                        updateFields.push(`provider_id = NULL`);
                    }
                }
                if (client_id !== undefined) {
                    // Only add client_id if it's a valid value
                    if (client_id) {
                        updateFields.push(`client_id = $${valueCounter}`);
                        updateValues.push(client_id);
                        valueCounter++;
                    }
                    else {
                        // Set to NULL if empty
                        updateFields.push(`client_id = NULL`);
                    }
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
                    console.log("Updating invoice items:", items);
                    // Get current items to compare
                    const currentItems = await (0, db_1.query)('SELECT * FROM invoice_items WHERE invoice_id = $1', [id]);
                    // Map of current items by product_id for easy lookup
                    const currentItemsByProductId = new Map();
                    currentItems.rows.forEach((item) => {
                        // Store both by ID and by product_id for lookups
                        currentItemsByProductId.set(item.product_id, item);
                    });
                    // Map to track which items have been processed
                    const processedItemIds = new Set();
                    // Process items
                    for (const item of items) {
                        if (!item.product_id) {
                            console.warn("Skipping item without product_id:", item);
                            continue;
                        }
                        const existingItem = currentItemsByProductId.get(item.product_id);
                        if (existingItem) {
                            // Update existing item
                            console.log(`Updating existing item for product ${item.product_id}, quantity: ${item.quantity}`);
                            await (0, db_1.query)(`
              UPDATE invoice_items
              SET quantity = $1, unit_price = $2, discount = $3, updated_at = CURRENT_TIMESTAMP
              WHERE id = $4
            `, [item.quantity, item.unit_price, item.discount || 0, existingItem.id]);
                            // Mark as processed
                            processedItemIds.add(existingItem.id);
                        }
                        else {
                            // Create new item
                            console.log(`Creating new item for product ${item.product_id}, quantity: ${item.quantity}`);
                            await (0, db_1.query)(`
              INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, discount)
              VALUES ($1, $2, $3, $4, $5)
            `, [id, item.product_id, item.quantity, item.unit_price, item.discount || 0]);
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
                    // Delete items that weren't in the update (if removeUnlistedItems is provided)
                    if (req.body.removeUnlistedItems === true) {
                        for (const item of currentItems.rows) {
                            if (!processedItemIds.has(item.id)) {
                                console.log(`Removing item id ${item.id} for product ${item.product_id}`);
                                await (0, db_1.query)('DELETE FROM invoice_items WHERE id = $1', [item.id]);
                            }
                        }
                    }
                }
                // Commit the transaction
                await (0, db_1.query)('COMMIT');
                // Get the updated invoice with all details
                const updatedResult = await (0, db_1.query)(`
        SELECT i.*, 
          CASE 
            WHEN i.client_id IS NOT NULL THEN 
              (SELECT row_to_json(c) FROM (SELECT name, email, phone, address FROM clients WHERE id = i.client_id) c)
            ELSE NULL 
          END as client,
          CASE 
            WHEN i.provider_id IS NOT NULL THEN 
              (SELECT row_to_json(p) FROM (SELECT name, email, phone, address FROM providers WHERE id = i.provider_id) p)
            ELSE NULL 
          END as provider,
          (
            SELECT json_agg(ii_data) FROM (
              SELECT 
                ii.*, 
                p.name as product_name,
                p.description as product_description,
                p.reference,
                p.sku,
                pc.name as category_name,
                pb.name as brand_name,
                (ii.quantity * ii.unit_price * (1 - ii.discount / 100)) as total
              FROM invoice_items ii
              LEFT JOIN products p ON ii.product_id = p.id
              LEFT JOIN product_categories pc ON p.category_id = pc.id
              LEFT JOIN product_brands pb ON p.brand_id = pb.id
              WHERE ii.invoice_id = i.id
            ) ii_data
          ) as items
        FROM invoices i
        WHERE i.id = $1
      `, [id]);
                if (updatedResult.rows.length === 0) {
                    return next(new errorHandler_1.AppError('Invoice not found with this ID', 404));
                }
                // Format the response
                const invoiceData = updatedResult.rows[0];
                const formattedInvoice = {
                    ...invoiceData,
                    client_name: invoiceData.client?.name || '',
                    client_email: invoiceData.client?.email || '',
                    client_phone: invoiceData.client?.phone || '',
                    client_address: invoiceData.client?.address || '',
                    provider_name: invoiceData.provider?.name || '',
                    provider_email: invoiceData.provider?.email || '',
                    provider_phone: invoiceData.provider?.phone || '',
                    provider_address: invoiceData.provider?.address || '',
                    items: invoiceData.items || [],
                    subtotal: (invoiceData.items || []).reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0),
                };
                formattedInvoice.total = formattedInvoice.subtotal * (1 + (parseFloat(formattedInvoice.tax_rate) || 0) / 100);
                res.status(200).json({
                    status: 'success',
                    data: formattedInvoice
                });
            }
            catch (error) {
                // Rollback the transaction in case of error
                await (0, db_1.query)('ROLLBACK');
                // Type assertion using our DatabaseError interface
                const dbError = error;
                console.error("Error updating invoice:", {
                    message: dbError.message,
                    stack: dbError.stack,
                    code: dbError.code,
                    detail: dbError.detail,
                    constraint: dbError.constraint,
                    table: dbError.table,
                    column: dbError.column
                });
                // Handle specific database errors
                if (dbError.code === '23503') { // Foreign key violation
                    return next(new errorHandler_1.AppError(`Referenced entity not found: ${dbError.detail}`, 400));
                }
                else if (dbError.code === '22P02') { // Invalid text representation
                    return next(new errorHandler_1.AppError(`Invalid input format: ${dbError.message}`, 400));
                }
                return next(new errorHandler_1.AppError(`Database error: ${dbError.message}`, 500));
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
        this.getByStatus = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            try {
                const { status } = req.params;
                const result = await (0, db_1.query)(`
        SELECT * FROM invoices WHERE status = $1
      `, [status]);
                res.status(200).json({
                    status: 'success',
                    results: result.rows.length,
                    data: result.rows
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Update invoice status
        this.updateStatus = (0, errorHandler_1.catchAsync)(async (req, res, next) => {
            try {
                const { id } = req.params;
                const { status } = req.body;
                const result = await (0, db_1.query)(`
        UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *
      `, [status, id]);
                if (!result.rows.length) {
                    return next(new errorHandler_1.AppError(`No invoice found with ID: ${id}`, 404));
                }
                res.status(200).json({
                    status: 'success',
                    data: result.rows[0]
                });
            }
            catch (error) {
                next(error);
            }
        });
        // Simplified version of getAll with minimal joins for better reliability
        this.getSimplified = (0, errorHandler_1.catchAsync)(async (req, res) => {
            try {
                console.log("Fetching simplified invoices (minimal joins)");
                // Simple query with minimal joins
                const result = await (0, db_1.query)(`
        SELECT 
          i.*,
          COALESCE(c.name, '') as client_name,
          COALESCE(p.name, '') as provider_name
        FROM invoices i
        LEFT JOIN clients c ON i.client_id = c.id
        LEFT JOIN providers p ON i.provider_id = p.id
        ORDER BY i.date DESC
      `);
                // Map results to expected format
                const invoices = result.rows.map((row) => ({
                    id: row.id,
                    invoice_number: row.invoice_number,
                    date: row.date,
                    due_date: row.due_date,
                    status: row.status,
                    notes: row.notes,
                    tax_rate: row.tax_rate,
                    client_id: row.client_id,
                    client_name: row.client_name,
                    provider_id: row.provider_id,
                    provider_name: row.provider_name,
                    created_at: row.created_at,
                    updated_at: row.updated_at,
                    // Provide empty arrays/defaults for normally joined data
                    items: [],
                    subtotal: 0,
                    total: 0
                }));
                console.log("Successfully retrieved simplified invoices. Count:", invoices.length);
                res.status(200).json({
                    status: 'success',
                    results: invoices.length,
                    data: invoices
                });
            }
            catch (error) {
                console.error("Error in getSimplified invoices:", error);
                res.status(500).json({
                    status: 'error',
                    message: 'Failed to retrieve simplified invoices',
                    error: error instanceof Error ? error.message : String(error)
                });
            }
        });
    }
}
exports.default = new InvoiceController();
//# sourceMappingURL=invoiceController.js.map