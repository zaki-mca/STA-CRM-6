import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

// Import routes
import clientRoutes from './routes/clientRoutes';
import providerRoutes from './routes/providerRoutes';
import productRoutes from './routes/productRoutes';
import categoryRoutes from './routes/categoryRoutes';
import brandRoutes from './routes/brandRoutes';
import invoiceRoutes from './routes/invoiceRoutes';
import orderRoutes from './routes/orderRoutes';
import professionalDomainRoutes from './routes/professionalDomainRoutes';
import clientLogRoutes from './routes/clientLogRoutes';
import orderLogRoutes from './routes/orderLogRoutes';
import orderLogEntryRoutes from './routes/orderLogEntryRoutes';

// Import error handler
import { handleError, AppError } from './utils/errorHandler';

// Setup DB connection
import './db';
import { checkHealth } from './db';
import { serverMonitor } from './utils/monitoring';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Apply middlewares
app.use(helmet()); // Security headers
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// Configure CORS
const corsOptions = {
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], // Frontend URL(s)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Allow cookies if using authentication
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions)); // Enable CORS with options

// Apply rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Enhanced health check endpoint
app.get('/api/health', async (req: Request, res: Response) => {
  try {
    // Check database connection
    const dbHealthy = await checkHealth();
    const isMonitoring = !!serverMonitor.getHealthStatus();
    
    // Collect system information
    const healthInfo = {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      monitoring: {
        active: isMonitoring,
        status: serverMonitor.getHealthStatus() ? 'healthy' : 'unhealthy'
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
    } else {
      res.status(500).json(healthInfo);
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

// API routes
app.use('/api/clients', clientRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/professional-domains', professionalDomainRoutes);
app.use('/api/client-logs', clientLogRoutes);
app.use('/api/order-logs', orderLogRoutes);
app.use('/api/order-log-entries', orderLogEntryRoutes);

// Handle undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global error handler
app.use(handleError);

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  
  // Start the server monitoring service (check every 30 seconds)
  serverMonitor.start(30000);
  
  // Register a shutdown handler to clean up resources
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    
    // Stop the monitoring service
    serverMonitor.stop();
    
    // Close the server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  });
}); 