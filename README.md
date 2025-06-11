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

Customer Relationship Management system with full-featured backend API and modern React frontend.

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

- dark mode theme
- repor print
- bulk add with csv or xls file
- bulk delete/select/edit
- images upload for product
- api product adapt to woocommerce

- display more data for clients in clients daily logs
- display providers data: phone and adress in invoice details, then display reference and category and brand and unit price in invoice items
- logs

- Product not item
- issue when update order or invoice product duplicate
- generate sku when cretin a new product

- fix adding in quick actions


