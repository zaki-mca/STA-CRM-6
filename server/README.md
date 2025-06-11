# STA CRM Backend API

This is the backend API for the STA CRM application. It provides a comprehensive RESTful API for managing clients, providers, products, orders, invoices, and more.

## Technologies

- Node.js
- TypeScript
- Express.js
- PostgreSQL
- Zod (for validation)

## Prerequisites

- Node.js (v14+)
- PostgreSQL (v12+)

## Setup

1. Clone the repository
2. Navigate to the server directory:

```bash
cd server
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the server directory (use the provided `.env` file as a template):

```
# Database Configuration
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sta_crm
PGUSER=postgres
PGHOST=localhost
PGPASSWORD=postgres
PGDATABASE=sta_crm
PGPORT=5432

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration (for authentication)
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
```

5. Set up the database:

```bash
npx ts-node src/db/setupDb.ts
```

## Running the Application

### Development Mode

```bash
npm run dev
```

This will start the server with nodemon, which will automatically restart the server when you make changes to the code.

### Production Mode

```bash
npm run build
npm start
```

## API Endpoints

The API provides the following endpoints:

### Health Check
- `GET /api/health` - Check if the server is running

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create a new client
- `PUT /api/clients/:id` - Update a client
- `DELETE /api/clients/:id` - Delete a client
- `GET /api/clients/:id/orders` - Get orders for a client
- `GET /api/clients/:id/invoices` - Get invoices for a client
- `GET /api/clients/:id/logs` - Get logs for a client

### Providers
- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get provider by ID
- `POST /api/providers` - Create a new provider
- `PUT /api/providers/:id` - Update a provider
- `DELETE /api/providers/:id` - Delete a provider
- `GET /api/providers/:id/products` - Get products for a provider
- `GET /api/providers/:id/orders` - Get orders related to a provider

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get product by ID
- `POST /api/products` - Create a new product
- `PUT /api/products/:id` - Update a product
- `DELETE /api/products/:id` - Delete a product
- `GET /api/products/category/:categoryId` - Get products by category
- `GET /api/products/brand/:brandId` - Get products by brand
- `GET /api/products/low-stock` - Get products with low stock
- `PATCH /api/products/:id/quantity` - Update product quantity

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create a new category
- `PUT /api/categories/:id` - Update a category
- `DELETE /api/categories/:id` - Delete a category

### Brands
- `GET /api/brands` - Get all brands
- `GET /api/brands/:id` - Get brand by ID
- `POST /api/brands` - Create a new brand
- `PUT /api/brands/:id` - Update a brand
- `DELETE /api/brands/:id` - Delete a brand

### Professional Domains
- `GET /api/professional-domains` - Get all professional domains
- `GET /api/professional-domains/:id` - Get professional domain by ID
- `POST /api/professional-domains` - Create a new professional domain
- `PUT /api/professional-domains/:id` - Update a professional domain
- `DELETE /api/professional-domains/:id` - Delete a professional domain
- `GET /api/professional-domains/:id/clients` - Get clients by professional domain

### Orders
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update an order
- `DELETE /api/orders/:id` - Delete an order
- `GET /api/orders/status/:status` - Get orders by status
- `PATCH /api/orders/:id/status` - Update order status
- `POST /api/orders/:id/create-invoice` - Create an invoice from an order
- `GET /api/orders/:id/logs` - Get logs for an order

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/:id` - Get invoice by ID
- `POST /api/invoices` - Create a new invoice
- `PUT /api/invoices/:id` - Update an invoice
- `DELETE /api/invoices/:id` - Delete an invoice
- `GET /api/invoices/status/:status` - Get invoices by status
- `PATCH /api/invoices/:id/status` - Update invoice status

### Client Logs
- `GET /api/client-logs` - Get all client logs
- `GET /api/client-logs/:id` - Get client log by ID
- `POST /api/client-logs` - Create a new client log
- `PUT /api/client-logs/:id` - Update a client log
- `DELETE /api/client-logs/:id` - Delete a client log
- `GET /api/client-logs/client/:clientId` - Get logs for a specific client
- `GET /api/client-logs/date-range` - Get client logs by date range
- `GET /api/client-logs/today` - Get client logs for today

### Order Logs
- `GET /api/order-logs` - Get all order logs
- `GET /api/order-logs/:id` - Get order log by ID
- `POST /api/order-logs` - Create a new order log
- `PUT /api/order-logs/:id` - Update an order log
- `DELETE /api/order-logs/:id` - Delete an order log
- `GET /api/order-logs/order/:orderId` - Get logs for a specific order
- `GET /api/order-logs/date-range` - Get order logs by date range
- `GET /api/order-logs/today` - Get order logs for today

## Error Handling

The API uses a centralized error handling mechanism. All errors are properly formatted and returned with appropriate HTTP status codes.

## Database Schema

The database schema is defined in `src/db/schema.sql` and includes tables for:
- Clients
- Providers
- Products
- Categories
- Brands
- Professional Domains
- Orders and Order Items
- Invoices and Invoice Items
- Client Logs and Order Logs

## License

[MIT](LICENSE) 