# Crm design requirements

*Automatically synced with your [v0.dev](https://v0.dev) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/zakarias-projects-13c300c1/v0-crm-design-requirements)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.dev-black?style=for-the-badge)](https://v0.dev/chat/projects/QAmrGvNloXO)

## Overview

This repository will stay in sync with your deployed chats on [v0.dev](https://v0.dev).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.dev](https://v0.dev).

## Deployment

Your project is live at:

**[https://vercel.com/zakarias-projects-13c300c1/v0-crm-design-requirements](https://vercel.com/zakarias-projects-13c300c1/v0-crm-design-requirements)**

## Build your app

Continue building your app on:

**[https://v0.dev/chat/projects/QAmrGvNloXO](https://v0.dev/chat/projects/QAmrGvNloXO)**

## How It Works

1. Create and modify your project using [v0.dev](https://v0.dev)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository





- build a backend API that serves as the bridge between the frontend and PostgreSQL database using Node.js typescript
- install the PostgreSQL client library Configure connection string with the database credentials 
- Set up connection pooling for better performance Define routes for CRUD operations (GET, POST, PUT, DELETE)
- Implement data validation and error handling 
- Deploy the backend on localhost 
- Replace mock data with API calls using axios 
- Handle loading states and errors 
- Update state management to work with real data

- herre is a Quick Start Example (Node.js)
javascript// Basic Express server structure
const express = require('express');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

app.get('/api/users', async (req, res) => {
  const result = await pool.query('SELECT * FROM users');
  res.json(result.rows);
});


fix use effect fetch data


match the forms fields with the datatable schemma by creating fields in database datatable

# STA-CRM 6.0

A modern CRM system built with Next.js, Express, and PostgreSQL.

## Authentication System

The CRM implements a secure, production-ready authentication system with the following features:

### Security Features

- JWT-based authentication with access and refresh tokens
- Secure password hashing using bcrypt
- Email verification for new accounts
- Password reset functionality
- Session management with IP tracking
- Rate limiting to prevent brute force attacks
- Audit logging for security events
- Role-based access control (admin, manager, user)
- Account lockout after failed login attempts
- Secure session handling with automatic cleanup

### Database Tables

- `users`: Stores user accounts and profile information
- `refresh_tokens`: Manages JWT refresh tokens
- `user_sessions`: Tracks active user sessions
- `auth_audit_logs`: Logs authentication events

### API Endpoints

#### Public Routes

- `POST /auth/register`: Create a new user account
- `POST /auth/login`: Authenticate user and get tokens
- `POST /auth/forgot-password`: Request password reset
- `POST /auth/reset-password`: Reset password with token
- `GET /auth/verify-email/:token`: Verify email address

#### Protected Routes

- `POST /auth/refresh-token`: Get new access token
- `POST /auth/logout`: End user session

### Rate Limiting

- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Password Reset: 3 requests per hour

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sta_crm
DB_USER=postgres
DB_PASSWORD=change_this_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=change_this_to_a_secure_random_string_min_32_chars
JWT_REFRESH_SECRET=change_this_to_another_secure_random_string_min_32_chars
```

### Security Best Practices

1. **Password Storage**
   - Passwords are hashed using bcrypt
   - Salt rounds configurable via environment variables
   - Minimum password length enforced

2. **Session Security**
   - JWT tokens with short expiration
   - Refresh token rotation
   - IP-based session tracking
   - Automatic session cleanup

3. **Account Protection**
   - Email verification required
   - Account lockout after 5 failed attempts
   - Password reset with expiring tokens
   - Rate limiting on sensitive endpoints

4. **Audit Trail**
   - All authentication events logged
   - IP address and user agent tracking
   - Detailed error logging

### Default Admin Account

The system creates a default admin account during initial setup:
- Email: admin@example.com
- Password: change_this_password

**Important**: Change the default admin password immediately after first login.

## Database Schema Updates

The application has been updated to match form fields with database schema. The following changes have been made:

### Client Table Updates
- Added `gender` field (VARCHAR(10))
- Added `first_name` and `last_name` fields (VARCHAR(100))
- Added `birth_date` field (DATE)
- Added `ccp_account` field (VARCHAR(50))
- Added `cle` field (VARCHAR(10))
- Added `rip` field (VARCHAR(100))
- Added `rip_cle` field (VARCHAR(10))
- Added `revenue` field (DECIMAL(12,2))

### Product Table Updates
- Added `reference` field (VARCHAR(100))
- Added `sell_price` field (DECIMAL(10,2))
- Added `buy_price` field (DECIMAL(10,2))
- Existing `price` field is now kept in sync with `sell_price`

### Professional Domain Table Updates
- Added `payment_code` field (VARCHAR(50))

## Running Migrations

To apply these database changes, run the following command:

```bash
npm run db:migrate:all
```

This will run all migration files in the `server/src/db/migrations` directory in order.

## API Endpoints

The API endpoints have been updated to handle the new fields:

### Client Endpoints
- `POST /api/clients` - Create a new client with all fields
- `PUT /api/clients/:id` - Update a client with all fields

### Product Endpoints
- `POST /api/products` - Create a new product with all fields
- `PUT /api/products/:id` - Update a product with all fields

### Professional Domain Endpoints
- `POST /api/professional-domains` - Create a new professional domain with payment_code
- `PUT /api/professional-domains/:id` - Update a professional domain with payment_code

## Frontend Integration

The frontend has been updated to handle the new fields in the forms and display them in the UI. The mapping between frontend field names and database field names is handled in the CRM context.




please fix the console error in the screenshot
just fix the server errors without changing the front end
and check all the codebase check if there are any other similar issues with other features that need to be fixed

fix the database error without changing the frontend
dont change anything to thr front end just change the database datatable or context or server api controller database schema


Scan the frontend design and analyze the displayed data structure, including all forms, fields, and components. Based on this analysis, generate a PostgreSQL database schema that matches the data requirements for the frontend. Ensure the following:
	1.	Identify all tables, columns, and their data types based on the UI components and expected data.
	2.	Create primary keys for each table and establish relationships between tables using foreign keys where necessary.
	3.	Optimize the schema for efficient queries, considering indexing for frequently accessed fields.
	4.	Include constraints such as NOT NULL, UNIQUE, and default values where applicable.





todo :



- bulk add category/brand/professional domaine xls csv import

- data displayed structure
- display more data for clients in clients daily logs
- display providers data: phone and adress in invoice details, then display reference and category and brand and unit price in invoice items

- report print template

- ( Ask before apply ) api product adapt to woocommerce

- ok dark mode theme

- bulk delete/select/edit
- images upload for product
- issue when update order or invoice product duplicate
- issue when creating a new product in invoice
- role and users management 




- logs

- Product not item

- ok generate sku when cretin a new product -format-

- ok fix adding in quick actions

- ok succes and errors popup messages 
- ok warning confirmation when deleting someting (are you sure you want to delete)
- ok add deleted succesfully toast for everything that can be deleted








For example, if you want to modify a file and commit the changes, you would:
Make changes to your files
Stage the changes with git add . (or specific files)
Commit with git commit -m "Your commit message"