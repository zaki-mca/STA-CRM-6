"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderLogEntryIdSchema = exports.orderLogEntryBatchSchema = exports.orderLogEntrySchema = exports.orderLogIdSchema = exports.orderLogUpdateSchema = exports.orderLogSchema = exports.clientLogIdSchema = exports.clientLogUpdateSchema = exports.clientLogSchema = exports.orderIdSchema = exports.orderUpdateSchema = exports.orderSchema = exports.invoiceIdSchema = exports.invoiceUpdateSchema = exports.invoiceSchema = exports.professionalDomainIdSchema = exports.professionalDomainUpdateSchema = exports.professionalDomainSchema = exports.brandIdSchema = exports.brandUpdateSchema = exports.brandSchema = exports.categoryIdSchema = exports.categoryUpdateSchema = exports.categorySchema = exports.productIdSchema = exports.productUpdateSchema = exports.productSchema = exports.providerIdSchema = exports.providerUpdateSchema = exports.providerSchema = exports.clientIdSchema = exports.clientUpdateSchema = exports.clientSchema = exports.forgotPasswordSchema = exports.registerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
// Auth validation schemas
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long')
    })
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string().min(2, 'Username must be at least 2 characters long'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters long'),
        firstName: zod_1.z.string().min(2, 'First name must be at least 2 characters long'),
        lastName: zod_1.z.string().min(2, 'Last name must be at least 2 characters long'),
        isAdmin: zod_1.z.boolean().optional()
    })
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address')
    })
});
// Client validation schemas
exports.clientSchema = zod_1.z.object({
    body: zod_1.z.object({
        first_name: zod_1.z.string().min(2, 'First name must be at least 2 characters long'),
        last_name: zod_1.z.string().min(2, 'Last name must be at least 2 characters long'),
        gender: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email address'),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        company: zod_1.z.string().optional(),
        professional_domain_id: zod_1.z.string().uuid('Invalid professional domain ID').optional().nullable(),
        birth_date: zod_1.z.string().optional().nullable(),
        ccp_account: zod_1.z.string().optional().nullable(),
        cle: zod_1.z.string().optional().nullable(),
        rip: zod_1.z.string().optional().nullable(),
        rip_cle: zod_1.z.string().optional().nullable(),
        revenue: zod_1.z.number().optional().nullable(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
exports.clientUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid client ID'),
    }),
    body: zod_1.z.object({
        first_name: zod_1.z.string().min(2, 'First name must be at least 2 characters long').optional(),
        last_name: zod_1.z.string().min(2, 'Last name must be at least 2 characters long').optional(),
        gender: zod_1.z.string().optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        company: zod_1.z.string().optional(),
        professional_domain_id: zod_1.z.string().uuid('Invalid professional domain ID').optional().nullable(),
        birth_date: zod_1.z.string().optional().nullable(),
        ccp_account: zod_1.z.string().optional().nullable(),
        cle: zod_1.z.string().optional().nullable(),
        rip: zod_1.z.string().optional().nullable(),
        rip_cle: zod_1.z.string().optional().nullable(),
        revenue: zod_1.z.number().optional().nullable(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
exports.clientIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid client ID'),
    }),
});
// Provider validation schemas
exports.providerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        email: zod_1.z.string().email('Invalid email address'),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        contact_person: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
exports.providerUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid provider ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        email: zod_1.z.string().email('Invalid email address').optional(),
        phone: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        contact_person: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        status: zod_1.z.string().optional(),
    }),
});
exports.providerIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid provider ID'),
    }),
});
// Product validation schemas
exports.productSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        description: zod_1.z.string().optional(),
        sell_price: zod_1.z.number().positive('Selling price must be a positive number'),
        buy_price: zod_1.z.number().positive('Buying price must be a positive number').optional(),
        price: zod_1.z.number().positive('Price must be a positive number').optional(),
        reference: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative'),
        category_id: zod_1.z.string().uuid('Invalid category ID').optional().nullable(),
        brand_id: zod_1.z.string().uuid('Invalid brand ID').optional().nullable(),
        sku: zod_1.z.string().optional(),
        image_url: zod_1.z.string().optional().nullable(),
    }),
});
exports.productUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid product ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        description: zod_1.z.string().optional(),
        sell_price: zod_1.z.number().positive('Selling price must be a positive number').optional(),
        buy_price: zod_1.z.number().positive('Buying price must be a positive number').optional(),
        price: zod_1.z.number().positive('Price must be a positive number').optional(),
        reference: zod_1.z.string().optional(),
        quantity: zod_1.z.number().int('Quantity must be an integer').nonnegative('Quantity must be non-negative').optional(),
        category_id: zod_1.z.string().uuid('Invalid category ID').optional().nullable(),
        brand_id: zod_1.z.string().uuid('Invalid brand ID').optional().nullable(),
        sku: zod_1.z.string().optional(),
        image_url: zod_1.z.string().optional().nullable(),
    }),
});
exports.productIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid product ID'),
    }),
});
// Category validation schemas
exports.categorySchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        description: zod_1.z.string().optional(),
    }),
});
exports.categoryUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid category ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        description: zod_1.z.string().optional(),
    }),
});
exports.categoryIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid category ID'),
    }),
});
// Brand validation schemas
exports.brandSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        description: zod_1.z.string().optional(),
        logo_url: zod_1.z.string().optional().nullable(),
    }),
});
exports.brandUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid brand ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        description: zod_1.z.string().optional(),
        logo_url: zod_1.z.string().optional().nullable(),
    }),
});
exports.brandIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid brand ID'),
    }),
});
// Professional Domain validation schemas
exports.professionalDomainSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long'),
        description: zod_1.z.string().optional(),
        payment_code: zod_1.z.string().optional(),
    }),
});
exports.professionalDomainUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid professional domain ID'),
    }),
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters long').optional(),
        description: zod_1.z.string().optional(),
        payment_code: zod_1.z.string().optional(),
    }),
});
exports.professionalDomainIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid professional domain ID'),
    }),
});
// Invoice validation schemas
exports.invoiceSchema = zod_1.z.object({
    body: zod_1.z.object({
        provider_id: zod_1.z.string().uuid('Invalid provider ID'),
        invoice_number: zod_1.z.string().min(3, 'Invoice number must be at least 3 characters long').optional(),
        date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional().nullable(),
        due_date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional().nullable(),
        status: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional().nullable(),
        tax_rate: zod_1.z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.union([
                zod_1.z.string().uuid('Invalid item ID'),
                zod_1.z.string().startsWith('temp-', 'Temporary ID must start with temp-'),
                zod_1.z.null()
            ]).optional().nullable(),
            product_id: zod_1.z.string().uuid('Invalid product ID'),
            quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
            unit_price: zod_1.z.number().positive('Unit price must be positive'),
            discount: zod_1.z.number().min(0, 'Discount must be non-negative').max(100, 'Discount cannot exceed 100%').optional().nullable(),
            update_inventory: zod_1.z.boolean().optional(),
        })),
    }),
});
exports.invoiceUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid invoice ID'),
    }),
    body: zod_1.z.object({
        provider_id: zod_1.z.string().uuid('Invalid provider ID').optional(),
        invoice_number: zod_1.z.string().min(3, 'Invoice number must be at least 3 characters long').optional(),
        date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional().nullable(),
        due_date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional().nullable(),
        status: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional().nullable(),
        tax_rate: zod_1.z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional().nullable(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.union([
                zod_1.z.string().uuid('Invalid item ID'),
                zod_1.z.string().startsWith('temp-', 'Temporary ID must start with temp-'),
                zod_1.z.null()
            ]).optional().nullable(),
            product_id: zod_1.z.string().uuid('Invalid product ID'),
            quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
            unit_price: zod_1.z.number().positive('Unit price must be positive'),
            discount: zod_1.z.number().min(0, 'Discount must be non-negative').max(100, 'Discount cannot exceed 100%').optional().nullable(),
            update_inventory: zod_1.z.boolean().optional(),
        })).optional(),
    }),
});
exports.invoiceIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid invoice ID'),
    }),
});
// Order validation schemas
exports.orderSchema = zod_1.z.object({
    body: zod_1.z.object({
        client_id: zod_1.z.string().uuid('Invalid client ID'),
        order_number: zod_1.z.string().min(3, 'Order number must be at least 3 characters long').optional(),
        order_date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        expected_delivery: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        status: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        shipping_address: zod_1.z.string().optional(),
        client: zod_1.z.object({
            id: zod_1.z.string().uuid('Invalid client ID'),
            address: zod_1.z.string().optional()
        }).optional(),
        expectedDelivery: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        items: zod_1.z.array(zod_1.z.object({
            product_id: zod_1.z.string().uuid('Invalid product ID'),
            quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
            unit_price: zod_1.z.number().positive('Unit price must be positive').optional(),
            update_inventory: zod_1.z.boolean().optional(),
            product: zod_1.z.object({
                id: zod_1.z.string().uuid('Invalid product ID')
            }).optional(),
            unitPrice: zod_1.z.number().positive('Unit price must be positive').optional(),
        })),
    }),
});
exports.orderUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid order ID'),
    }),
    body: zod_1.z.object({
        client_id: zod_1.z.string().uuid('Invalid client ID').optional(),
        order_number: zod_1.z.string().min(3, 'Order number must be at least 3 characters long').optional(),
        order_date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        expected_delivery: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        status: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        shipping_address: zod_1.z.string().optional(),
        client: zod_1.z.object({
            id: zod_1.z.string().uuid('Invalid client ID'),
            address: zod_1.z.string().optional()
        }).optional(),
        expectedDelivery: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        items: zod_1.z.array(zod_1.z.object({
            id: zod_1.z.string().uuid('Invalid item ID').optional(),
            product_id: zod_1.z.string().uuid('Invalid product ID'),
            quantity: zod_1.z.number().int('Quantity must be an integer').positive('Quantity must be positive'),
            unit_price: zod_1.z.number().positive('Unit price must be positive').optional(),
            update_inventory: zod_1.z.boolean().optional(),
            product: zod_1.z.object({
                id: zod_1.z.string().uuid('Invalid product ID')
            }).optional(),
            unitPrice: zod_1.z.number().positive('Unit price must be positive').optional(),
        })).optional(),
        removeUnlistedItems: zod_1.z.boolean().optional(),
    }),
});
exports.orderIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid order ID'),
    }),
});
// Client logs validation schemas
exports.clientLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        client_id: zod_1.z.string().uuid('Invalid client ID'),
        description: zod_1.z.string().min(3, 'Description must be at least 3 characters long'),
        log_date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
        user_id: zod_1.z.string().uuid('Invalid user ID').optional(),
    }),
});
exports.clientLogUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid client log ID'),
    }),
    body: zod_1.z.object({
        client_id: zod_1.z.string().uuid('Invalid client ID').optional(),
        clientId: zod_1.z.string().uuid('Invalid client ID').optional(),
        description: zod_1.z.string().min(3, 'Description must be at least 3 characters long').optional(),
        log_date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        user_id: zod_1.z.string().uuid('Invalid user ID').optional(),
        action: zod_1.z.string().optional(),
        notes: zod_1.z.string().optional(),
        closedAt: zod_1.z.union([
            zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
                message: 'Invalid date format',
            }),
            zod_1.z.date()
        ]).optional(),
    }),
});
exports.clientLogIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid client log ID'),
    }),
});
// Order logs validation schemas
exports.orderLogSchema = zod_1.z.object({
    body: zod_1.z.object({
        description: zod_1.z.string().min(3, 'Description must be at least 3 characters long'),
        log_date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }),
        user_id: zod_1.z.string().uuid('Invalid user ID').optional(),
        orders: zod_1.z.array(zod_1.z.object({
            order_id: zod_1.z.string().uuid('Invalid order ID'),
            notes: zod_1.z.string().optional()
        })).optional(),
    }),
});
exports.orderLogUpdateSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid order log ID'),
    }),
    body: zod_1.z.object({
        description: zod_1.z.string().min(3, 'Description must be at least 3 characters long').optional(),
        log_date: zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
            message: 'Invalid date format',
        }).optional(),
        user_id: zod_1.z.string().uuid('Invalid user ID').optional(),
        action: zod_1.z.string().optional(),
        closedAt: zod_1.z.union([
            zod_1.z.string().refine((val) => !val || !isNaN(Date.parse(val)), {
                message: 'Invalid date format',
            }),
            zod_1.z.date()
        ]).optional(),
    }),
});
exports.orderLogIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid order log ID'),
    }),
});
// Order log entry validation schemas
exports.orderLogEntrySchema = zod_1.z.object({
    body: zod_1.z.object({
        order_log_id: zod_1.z.string().uuid('Invalid order log ID'),
        order_id: zod_1.z.string().uuid('Invalid order ID'),
        notes: zod_1.z.string().optional(),
    }),
});
exports.orderLogEntryBatchSchema = zod_1.z.object({
    body: zod_1.z.object({
        order_log_id: zod_1.z.string().uuid('Invalid order log ID'),
        entries: zod_1.z.array(zod_1.z.object({
            order_id: zod_1.z.string().uuid('Invalid order ID'),
            notes: zod_1.z.string().optional(),
        })),
    }),
});
exports.orderLogEntryIdSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid order log entry ID'),
    }),
});
//# sourceMappingURL=schemas.js.map