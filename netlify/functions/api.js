// This function serves as a bridge between Netlify Functions and the Express server
// It imports the API server and forwards requests to it

const path = require('path');
const serverless = require('serverless-http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Pool } = require('pg');

// Set up environment variables from Netlify's environment
// This ensures our server gets the correct environment configuration
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection
const pool = new Pool({
  connectionString: process.env.SUPABASE_DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, timestamp: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Basic route for testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    environment: process.env.NEXT_PUBLIC_SITE_ENV || 'unknown',
    timestamp: new Date().toISOString()
  });
});

// Brands API
app.get('/api/brands', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM brands ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Categories API
app.get('/api/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Professional Domains API
app.get('/api/professional-domains', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM professional_domains ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Providers API
app.get('/api/providers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM providers ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products API
app.get('/api/products', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.*, b.name as brand_name, c.name as category_name
      FROM products p
      LEFT JOIN brands b ON p.brand_id = b.id
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Clients API
app.get('/api/clients', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*, pd.name as professional_domain_name
      FROM clients c
      LEFT JOIN professional_domains pd ON c.professional_domain_id = pd.id
      ORDER BY c.name
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error', message: err.message });
});

// Export the serverless handler
exports.handler = serverless(app); 