import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
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

// Create Express app
const app = express();

// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  max: 100, // limit each IP to 100 requests per windowMs
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again in an hour!'
});

// Apply rate limiter to all routes
app.use(limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Routes
app.use('/api/auth', authRoutes);
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

// Health check endpoint
app.get('/health', async (req: Request, res: Response) => {
  const dbHealth = await checkHealth();
  res.json({
    status: dbHealth.healthy ? 'ok' : 'error',
    timestamp: new Date(),
    db: dbHealth
  });
});

// Handle undefined routes
app.all('*', (req: Request, res: Response, next: NextFunction) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Error handling middleware
app.use(handleError);

// Start server
const port = Number(process.env.PORT) || 3001;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Log important configuration (without sensitive details)
  console.log(`Database host: ${process.env.DB_HOST || 'Not configured'}`);
  console.log(`Database name: ${process.env.DB_NAME || 'Not configured'}`);
  
  // Start server monitoring
  serverMonitor.start();
  
  // Perform initial health check
  checkHealth().then(health => {
    if (!health.healthy) {
      console.error(`WARNING: Database connection issue: ${health.details}`);
      console.error('The server started but database connection failed. API calls requiring database access will fail.');
    } else {
      console.log('Database connection verified successfully.');
    }
  });
}); 