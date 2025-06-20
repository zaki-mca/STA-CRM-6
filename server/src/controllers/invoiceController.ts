import { Request, Response, NextFunction } from 'express';
import { query } from '../db';
import { catchAsync, AppError } from '../utils/errorHandler';
import { BaseController } from '../utils/baseController';

// Define interfaces for our data structures
interface DatabaseError {
  message: string;
  stack?: string;
  code?: string;
  detail?: string;
  constraint?: string;
  table?: string;
  column?: string;
}

interface InvoiceItem {
  id: number;
  product_id: number;
  product_name: string;
  product_description: string;
  reference: string;
  sku: string;
  category_id: string | number;
  category_name: string;
  brand_id: string | number;
  brand_name: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  date: string;
  due_date: string;
  status: string;
  notes: string;
  tax_rate: number;
  client_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  provider_id?: number;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  provider_address?: string;
  created_at: string;
  updated_at: string;
  items: InvoiceItem[];
  subtotal: number;
  total: number;
}

interface DBInvoiceRow {
  id: number;
  invoice_number: string;
  date: string;
  due_date: string;
  status: string;
  notes: string;
  tax_rate: number;
  client_id?: number;
  provider_id?: number;
  created_at: string;
  updated_at: string;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_address?: string;
  provider_name?: string;
  provider_email?: string;
  provider_phone?: string;
  provider_address?: string;
  [key: string]: any;
}

interface DBInvoiceItemRow {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  product_name: string;
  product_description: string;
  reference: string;
  sku: string;
  category_id: string | number;
  category_name: string;
  brand_id: string | number;
  brand_name: string;
  [key: string]: any;
}

// Define a new interface for invoice item rows from the database
interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  discount: number;
  [key: string]: any;
}

class InvoiceController extends BaseController {
  constructor() {
    super('invoices');
  }

  getAll = catchAsync(async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Fetching all invoices");
      const invoices = await query(`SELECT * FROM invoices`);
      res.status(200).json({
        status: 'success',
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch invoices',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  getById = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const invoice = await query(`SELECT * FROM invoices WHERE id = $1`, [id]);
      res.status(200).json({
        status: 'success',
        data: invoice
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch invoice',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  create = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { client_id, provider_id, items, ...rest } = req.body;
      const newInvoice = await query(`INSERT INTO invoices ... RETURNING *`, [client_id, provider_id, ...rest]);
      res.status(201).json({
        status: 'success',
        data: newInvoice
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to create invoice',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  update = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    const { provider_id, client_id, date, due_date, status, notes, tax_rate, items } = req.body;
    try {
      const updatedInvoice = await query(`UPDATE invoices SET ... WHERE id = $1 RETURNING *`, [id, provider_id, client_id, date, due_date, status, notes, tax_rate]);
      res.status(200).json({
        status: 'success',
        data: updatedInvoice
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update invoice',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  delete = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { id } = req.params;
    try {
      await query(`DELETE FROM invoices WHERE id = $1`, [id]);
      res.status(204).json({
        status: 'success',
        message: 'Invoice deleted'
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to delete invoice',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  getByStatus = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.params;
      const invoices = await query(`SELECT * FROM invoices WHERE status = $1`, [status]);
      res.status(200).json({
        status: 'success',
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch invoices by status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  updateStatus = catchAsync(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const updatedInvoice = await query(`UPDATE invoices SET status = $1 WHERE id = $2 RETURNING *`, [status, id]);
      res.status(200).json({
        status: 'success',
        data: updatedInvoice
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to update invoice status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });

  getSimplified = catchAsync(async (req: Request, res: Response): Promise<void> => {
    try {
      console.log("Fetching simplified invoices (minimal joins)");
      const invoices = await query(`SELECT id, client_id, provider_id, status FROM invoices`);
      res.status(200).json({
        status: 'success',
        data: invoices
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Failed to fetch simplified invoices',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  });
}

export default new InvoiceController(); 