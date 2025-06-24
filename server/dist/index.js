"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = require("express-rate-limit");
const path_1 = __importDefault(require("path"));
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const clientRoutes_1 = __importDefault(require("./routes/clientRoutes"));
const providerRoutes_1 = __importDefault(require("./routes/providerRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const categoryRoutes_1 = __importDefault(require("./routes/categoryRoutes"));
const brandRoutes_1 = __importDefault(require("./routes/brandRoutes"));
const invoiceRoutes_1 = __importDefault(require("./routes/invoiceRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const professionalDomainRoutes_1 = __importDefault(require("./routes/professionalDomainRoutes"));
const clientLogRoutes_1 = __importDefault(require("./routes/clientLogRoutes"));
const orderLogRoutes_1 = __importDefault(require("./routes/orderLogRoutes"));
const orderLogEntryRoutes_1 = __importDefault(require("./routes/orderLogEntryRoutes"));
// Import error handler
const errorHandler_1 = require("./utils/errorHandler");
// Setup DB connection
require("./db");
const db_1 = require("./db");
const monitoring_1 = require("./utils/monitoring");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Create Express app
const app = (0, express_1.default)();
// Set security HTTP headers
app.use((0, helmet_1.default)());
// Enable CORS
app.use((0, cors_1.default)());
// Rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    max: 100, // limit each IP to 100 requests per windowMs
    windowMs: 60 * 60 * 1000, // 1 hour
    message: 'Too many requests from this IP, please try again in an hour!'
});
// Apply rate limiter to all routes
app.use(limiter);
// Body parser, reading data from body into req.body
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api/clients', clientRoutes_1.default);
app.use('/api/providers', providerRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/categories', categoryRoutes_1.default);
app.use('/api/brands', brandRoutes_1.default);
app.use('/api/invoices', invoiceRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/professional-domains', professionalDomainRoutes_1.default);
app.use('/api/client-logs', clientLogRoutes_1.default);
app.use('/api/order-logs', orderLogRoutes_1.default);
app.use('/api/order-log-entries', orderLogEntryRoutes_1.default);
// Health check endpoint
app.get('/health', async (req, res) => {
    const dbHealth = await (0, db_1.checkHealth)();
    res.json({
        status: dbHealth.healthy ? 'ok' : 'error',
        timestamp: new Date(),
        db: dbHealth
    });
});
// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new errorHandler_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Error handling middleware
app.use(errorHandler_1.handleError);
// Start server
const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    // Log important configuration (without sensitive details)
    console.log(`Database host: ${process.env.DB_HOST || 'Not configured'}`);
    console.log(`Database name: ${process.env.DB_NAME || 'Not configured'}`);
    // Start server monitoring
    monitoring_1.serverMonitor.start();
    // Perform initial health check
    (0, db_1.checkHealth)().then(health => {
        if (!health.healthy) {
            console.error(`WARNING: Database connection issue: ${health.details}`);
            console.error('The server started but database connection failed. API calls requiring database access will fail.');
        }
        else {
            console.log('Database connection verified successfully.');
        }
    });
});
//# sourceMappingURL=index.js.map