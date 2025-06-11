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
// Import error handler
const errorHandler_1 = require("./utils/errorHandler");
// Setup DB connection
require("./db");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../.env') });
// Initialize express app
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Apply middlewares
app.use((0, helmet_1.default)()); // Security headers
app.use(express_1.default.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies
// Configure CORS
const corsOptions = {
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend URL(s)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true, // Allow cookies if using authentication
    optionsSuccessStatus: 204,
};
app.use((0, cors_1.default)(corsOptions)); // Enable CORS with options
// Apply rate limiting
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Server is running',
        timestamp: new Date()
    });
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
// Handle undefined routes
app.all('*', (req, res, next) => {
    next(new errorHandler_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global error handler
app.use(errorHandler_1.handleError);
// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});
//# sourceMappingURL=index.js.map