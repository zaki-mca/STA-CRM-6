import { z } from 'zod';

// Client validation schemas
export const clientSchema = z.object({
  body: z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters long'),
    last_name: z.string().min(2, 'Last name must be at least 2 characters long'),
    gender: z.string().optional(),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
    professional_domain_id: z.string().uuid('Invalid professional domain ID').optional().nullable(),
    birth_date: z.string().optional().nullable(),
    ccp_account: z.string().optional().nullable(),
    cle: z.string().optional().nullable(),
    rip: z.string().optional().nullable(),
    rip_cle: z.string().optional().nullable(),
    revenue: z.number().optional().nullable(),
    notes: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const clientUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client ID'),
  }),
  body: z.object({
    first_name: z.string().min(2, 'First name must be at least 2 characters long').optional(),
    last_name: z.string().min(2, 'Last name must be at least 2 characters long').optional(),
    gender: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    company: z.string().optional(),
    professional_domain_id: z.string().uuid('Invalid professional domain ID').optional().nullable(),
    birth_date: z.string().optional().nullable(),
    ccp_account: z.string().optional().nullable(),
    cle: z.string().optional().nullable(),
    rip: z.string().optional().nullable(),
    rip_cle: z.string().optional().nullable(),
    revenue: z.number().optional().nullable(),
    notes: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const clientIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client ID'),
  }),
});

// Provider validation schemas
export const providerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
    address: z.string().optional(),
    contact_person: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const providerUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid provider ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    email: z.string().email('Invalid email address').optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    contact_person: z.string().optional(),
    notes: z.string().optional(),
    status: z.string().optional(),
  }),
});

export const providerIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid provider ID'),
  }),
});

// Product validation schemas
export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    description: z.string().optional(),
    sell_price: z.number().positive('Selling price must be a positive number'),
    buy_price: z.number().positive('Buying price must be a positive number').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    reference: z.string().optional(),
    quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative'),
    category_id: z.string().uuid('Invalid category ID').optional().nullable(),
    brand_id: z.string().uuid('Invalid brand ID').optional().nullable(),
    sku: z.string().optional(),
    image_url: z.string().optional().nullable(),
  }),
});

export const productUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    description: z.string().optional(),
    sell_price: z.number().positive('Selling price must be a positive number').optional(),
    buy_price: z.number().positive('Buying price must be a positive number').optional(),
    price: z.number().positive('Price must be a positive number').optional(),
    reference: z.string().optional(),
    quantity: z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative').optional(),
    category_id: z.string().uuid('Invalid category ID').optional().nullable(),
    brand_id: z.string().uuid('Invalid brand ID').optional().nullable(),
    sku: z.string().optional(),
    image_url: z.string().optional().nullable(),
  }),
});

export const productIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
});

// Category validation schemas
export const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    description: z.string().optional(),
  }),
});

export const categoryUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    description: z.string().optional(),
  }),
});

export const categoryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
});

// Brand validation schemas
export const brandSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    description: z.string().optional(),
    logo_url: z.string().optional().nullable(),
  }),
});

export const brandUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid brand ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    description: z.string().optional(),
    logo_url: z.string().optional().nullable(),
  }),
});

export const brandIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid brand ID'),
  }),
});

// Professional Domain validation schemas
export const professionalDomainSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    description: z.string().optional(),
    payment_code: z.string().optional(),
  }),
});

export const professionalDomainUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid professional domain ID'),
  }),
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters long').optional(),
    description: z.string().optional(),
    payment_code: z.string().optional(),
  }),
});

export const professionalDomainIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid professional domain ID'),
  }),
});

// Invoice validation schemas
export const invoiceSchema = z.object({
  body: z.object({
    provider_id: z.string().uuid('Invalid provider ID'),
    invoice_number: z.string().min(3, 'Invoice number must be at least 3 characters long').optional(),
    date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional().nullable(),
    due_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional().nullable(),
    status: z.string().optional(),
    notes: z.string().optional().nullable(),
    tax_rate: z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional().nullable(),
    items: z.array(z.object({
      id: z.union([
        z.string().uuid('Invalid item ID'),
        z.string().startsWith('temp-', 'Temporary ID must start with temp-'),
        z.null()
      ]).optional().nullable(),
      product_id: z.string().uuid('Invalid product ID'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
      discount: z.number().min(0, 'Discount must be non-negative').max(100, 'Discount cannot exceed 100%').optional().nullable(),
      update_inventory: z.boolean().optional(),
    })),
  }),
});

export const invoiceUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID'),
  }),
  body: z.object({
    provider_id: z.string().uuid('Invalid provider ID').optional(),
    invoice_number: z.string().min(3, 'Invoice number must be at least 3 characters long').optional(),
    date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional().nullable(),
    due_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional().nullable(),
    status: z.string().optional(),
    notes: z.string().optional().nullable(),
    tax_rate: z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional().nullable(),
    items: z.array(z.object({
      id: z.union([
        z.string().uuid('Invalid item ID'),
        z.string().startsWith('temp-', 'Temporary ID must start with temp-'),
        z.null()
      ]).optional().nullable(),
      product_id: z.string().uuid('Invalid product ID'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive'),
      discount: z.number().min(0, 'Discount must be non-negative').max(100, 'Discount cannot exceed 100%').optional().nullable(),
      update_inventory: z.boolean().optional(),
    })).optional(),
  }),
});

export const invoiceIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid invoice ID'),
  }),
});

// Order validation schemas
export const orderSchema = z.object({
  body: z.object({
    client_id: z.string().uuid('Invalid client ID'),
    order_number: z.string().min(3, 'Order number must be at least 3 characters long').optional(),
    order_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    expected_delivery: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    shipping_address: z.string().optional(),
    client: z.object({
      id: z.string().uuid('Invalid client ID'),
      address: z.string().optional()
    }).optional(),
    expectedDelivery: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    items: z.array(z.object({
      product_id: z.string().uuid('Invalid product ID'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive').optional(),
      update_inventory: z.boolean().optional(),
      product: z.object({
        id: z.string().uuid('Invalid product ID')
      }).optional(),
      unitPrice: z.number().positive('Unit price must be positive').optional(),
    })),
  }),
});

export const orderUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
  body: z.object({
    client_id: z.string().uuid('Invalid client ID').optional(),
    order_number: z.string().min(3, 'Order number must be at least 3 characters long').optional(),
    order_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    expected_delivery: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    status: z.string().optional(),
    notes: z.string().optional(),
    shipping_address: z.string().optional(),
    client: z.object({
      id: z.string().uuid('Invalid client ID'),
      address: z.string().optional()
    }).optional(),
    expectedDelivery: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    items: z.array(z.object({
      id: z.string().uuid('Invalid item ID').optional(),
      product_id: z.string().uuid('Invalid product ID'),
      quantity: z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
      unit_price: z.number().positive('Unit price must be positive').optional(),
      update_inventory: z.boolean().optional(),
      product: z.object({
        id: z.string().uuid('Invalid product ID')
      }).optional(),
      unitPrice: z.number().positive('Unit price must be positive').optional(),
    })).optional(),
    removeUnlistedItems: z.boolean().optional(),
  }),
});

export const orderIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

// Client logs validation schemas
export const clientLogSchema = z.object({
  body: z.object({
    client_id: z.string().uuid('Invalid client ID'),
    description: z.string().min(3, 'Description must be at least 3 characters long'),
    log_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    user_id: z.string().uuid('Invalid user ID').optional(),
  }),
});

export const clientLogUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client log ID'),
  }),
  body: z.object({
    client_id: z.string().uuid('Invalid client ID').optional(),
    clientId: z.string().uuid('Invalid client ID').optional(),
    description: z.string().min(3, 'Description must be at least 3 characters long').optional(),
    log_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    user_id: z.string().uuid('Invalid user ID').optional(),
    action: z.string().optional(),
    notes: z.string().optional(),
    closedAt: z.union([
      z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
      z.date()
    ]).optional(),
  }),
});

export const clientLogIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid client log ID'),
  }),
});

// Order logs validation schemas
export const orderLogSchema = z.object({
  body: z.object({
    description: z.string().min(3, 'Description must be at least 3 characters long'),
    log_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }),
    user_id: z.string().uuid('Invalid user ID').optional(),
    orders: z.array(
      z.object({
        order_id: z.string().uuid('Invalid order ID'),
        notes: z.string().optional()
      })
    ).optional(),
  }),
});

export const orderLogUpdateSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order log ID'),
  }),
  body: z.object({
    description: z.string().min(3, 'Description must be at least 3 characters long').optional(),
    log_date: z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
      message: 'Invalid date format',
    }).optional(),
    user_id: z.string().uuid('Invalid user ID').optional(),
    action: z.string().optional(),
    closedAt: z.union([
      z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
      }),
      z.date()
    ]).optional(),
  }),
});

export const orderLogIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order log ID'),
  }),
});

// Order log entry validation schemas
export const orderLogEntrySchema = z.object({
  body: z.object({
    order_log_id: z.string().uuid('Invalid order log ID'),
    order_id: z.string().uuid('Invalid order ID'),
    notes: z.string().optional(),
  }),
});

export const orderLogEntryBatchSchema = z.object({
  body: z.object({
    order_log_id: z.string().uuid('Invalid order log ID'),
    entries: z.array(
      z.object({
        order_id: z.string().uuid('Invalid order ID'),
        notes: z.string().optional(),
      })
    ),
  }),
});

export const orderLogEntryIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid order log entry ID'),
  }),
}); 