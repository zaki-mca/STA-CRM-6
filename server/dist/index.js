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
// Support both standalone server and Netlify function environments
if (process.env.NODE_ENV !== 'production') {
    const envPath = path_1.default.resolve(__dirname, '../.env');
    dotenv_1.default.config({ path: envPath });
    console.log(`Loaded environment from ${envPath}`);
}
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Apply middlewares
app.use((0, helmet_1.default)()); // Security headers
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
// Configure CORS - Allow specified origins or all origins in Netlify function environment
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.NEXT_PUBLIC_SITE_URL || '',
    '.netlify.app' // Allow all Netlify preview deployments
];
const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        // Check if the origin is allowed
        const isAllowed = allowedOrigins.some(allowedOrigin => allowedOrigin === '*' || // Wildcard
            origin === allowedOrigin || // Exact match
            (allowedOrigin.startsWith('.') && origin.endsWith(allowedOrigin)) // Domain suffix match
        );
        if (isAllowed) {
            return callback(null, true);
        }
        else {
            return callback(new Error('CORS not allowed'), false);
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if using authentication
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions)); // Enable CORS with options
// Apply rate limiting - Less strict for Netlify functions
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NETLIFY ? 300 : 100, // Higher limit for Netlify functions
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const dbHealthy = await (0, db_1.checkHealth)();
        const isMonitoring = !!monitoring_1.serverMonitor.getHealthStatus();
        // Collect system information
        const healthInfo = {
            status: dbHealthy ? 'healthy' : 'degraded',
            timestamp: new Date(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development',
            deployPlatform: process.env.NETLIFY ? 'netlify' : 'standalone',
            monitoring: {
                active: isMonitoring,
                status: monitoring_1.serverMonitor.getHealthStatus() ? 'healthy' : 'unhealthy'
            },
            database: {
                connected: dbHealthy,
                connectionString: process.env.DATABASE_URL ?
                    `${process.env.DATABASE_URL.split('@')[0].split(':')[0]}:****@${process.env.DATABASE_URL.split('@')[1] || ''}` :
                    'not configured'
            },
            memory: {
                rss: `${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`,
                heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
                heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`
            }
        };
        if (dbHealthy) {
            res.json(healthInfo);
        }
        else {
            res.status(500).json(healthInfo);
        }
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Health check failed',
            error: error instanceof Error ? error.message : String(error)
        });
    }
});
// API routes
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
// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new errorHandler_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global error handler
app.use(errorHandler_1.handleError);
// Only start the server in standalone mode (not when imported by Netlify function)
if (!process.env.NETLIFY && require.main === module) {
    const server = app.listen(PORT, async () => {
        console.log(`Server is running on port ${PORT}`);
        // Start the server monitoring service (check every 30 seconds)
        monitoring_1.serverMonitor.start(30000);
        // Register a shutdown handler to clean up resources
        process.on('SIGTERM', () => {
            console.log('SIGTERM signal received: closing HTTP server');
            // Stop the monitoring service
            monitoring_1.serverMonitor.stop();
            // Close the server
            server.close(() => {
                console.log('HTTP server closed');
                process.exit(0);
            });
        });
    });
}
// Export the app for serverless functions
exports.default = app;
module.exports = app;
//# sourceMappingURL=index.js.map