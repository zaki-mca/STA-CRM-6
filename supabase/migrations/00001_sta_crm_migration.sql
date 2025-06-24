-- STA-CRM 6.0 Initial Migration
-- This file sets up the complete database schema for the CRM system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types for consistent status values
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'client_status') THEN
        CREATE TYPE client_status AS ENUM ('lead', 'prospect', 'active', 'inactive');
    END IF;
END $$;

-- Create function for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Professional domains table (industry sectors)
CREATE TABLE IF NOT EXISTS professional_domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  payment_code VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories for products
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brands for products
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers (suppliers)
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  payment_terms VARCHAR(100),
  preferred_payment_method VARCHAR(100),
  tax_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clients (customers)
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(255),
  gender VARCHAR(50),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  company VARCHAR(255),
  professional_domain_id INTEGER REFERENCES professional_domains(id),
  birth_date DATE,
  ccp_account VARCHAR(100),
  cle VARCHAR(100),
  rip VARCHAR(100),
  rip_cle VARCHAR(100),
  revenue DECIMAL(12, 2),
  notes TEXT,
  status client_status DEFAULT 'lead',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT validate_client_name CHECK ((first_name IS NOT NULL AND last_name IS NOT NULL) OR display_name IS NOT NULL)
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  sell_price DECIMAL(10, 2),
  buy_price DECIMAL(10, 2),
  quantity INTEGER NOT NULL DEFAULT 0,
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  provider_id INTEGER REFERENCES providers(id),
  sku VARCHAR(100) UNIQUE,
  reference VARCHAR(100),
  image_url TEXT,
  barcode VARCHAR(100),
  weight DECIMAL(10, 2),
  dimensions VARCHAR(100),
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders from clients
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date TIMESTAMPTZ DEFAULT NOW(),
  expected_delivery_date TIMESTAMPTZ,
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  shipping_address TEXT,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(100),
  payment_status payment_status DEFAULT 'unpaid',
  payment_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices (both from providers and to clients)
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  provider_id INTEGER REFERENCES providers(id),
  client_id INTEGER REFERENCES clients(id),
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status payment_status DEFAULT 'unpaid',
  notes TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_date TIMESTAMPTZ,
  payment_method VARCHAR(100),
  payment_terms VARCHAR(100),
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_entity_reference CHECK (
    (client_id IS NOT NULL AND provider_id IS NULL) OR 
    (client_id IS NULL AND provider_id IS NOT NULL)
  )
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  item_code VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client activity logs
CREATE TABLE IF NOT EXISTS client_logs (
  id SERIAL PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client log detailed entries
CREATE TABLE IF NOT EXISTS client_log_entries (
  id SERIAL PRIMARY KEY,
  client_log_id INTEGER NOT NULL REFERENCES client_logs(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT NOT NULL,
  created_by VARCHAR(255),
  attachment_url TEXT,
  entry_type VARCHAR(50) DEFAULT 'note',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order activity logs
CREATE TABLE IF NOT EXISTS order_logs (
  id SERIAL PRIMARY KEY,
  log_date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to VARCHAR(255),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order log entries linking to specific orders
CREATE TABLE IF NOT EXISTS order_log_entries (
  id SERIAL PRIMARY KEY,
  order_log_id INTEGER NOT NULL REFERENCES order_logs(id) ON DELETE CASCADE,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notes TEXT,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255),
  attachment_url TEXT,
  entry_type VARCHAR(50) DEFAULT 'note',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_log_id, order_id)
);

-- Create update triggers for timestamp management
DO $$ 
DECLARE
    t text;
    tables CURSOR FOR 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        AND table_name NOT LIKE 'pg_%'
        AND table_name NOT LIKE 'schema_%';
BEGIN
    FOR t IN tables LOOP
        EXECUTE format('
            CREATE TRIGGER update_%s_timestamp
            BEFORE UPDATE ON %s
            FOR EACH ROW
            EXECUTE FUNCTION update_timestamp();
        ', t, t);
    END LOOP;
END $$;

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_clients_professional_domain_id ON clients(professional_domain_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_client_logs_client_id ON client_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_logs_date ON client_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_client_log_entries_client_log_id ON client_log_entries(client_log_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_date ON order_logs(log_date);
CREATE INDEX IF NOT EXISTS idx_order_log_entries_order_log_id ON order_log_entries(order_log_id);
CREATE INDEX IF NOT EXISTS idx_order_log_entries_order_id ON order_log_entries(order_id);

-- Initial user authentication tables (if not using Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some basic reference data
-- Insert sample professional domains
INSERT INTO professional_domains (name, description, payment_code) VALUES
  ('IT', 'Information Technology', 'IT-PAY'),
  ('Healthcare', 'Medical and healthcare services', 'HC-PAY'),
  ('Education', 'Educational institutions and services', 'EDU-PAY'),
  ('Manufacturing', 'Manufacturing and production', 'MFG-PAY'),
  ('Retail', 'Retail and commerce', 'RET-PAY')
ON CONFLICT (name) DO NOTHING;

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Office Supplies', 'Office stationery and supplies'),
  ('Furniture', 'Office and home furniture'),
  ('Software', 'Software licenses and subscriptions'),
  ('Hardware', 'Computer hardware and components')
ON CONFLICT (name) DO NOTHING;

-- Insert sample brands
INSERT INTO brands (name, description) VALUES
  ('Dell', 'Computer and technology hardware manufacturer'),
  ('HP', 'Hewlett-Packard technology company'),
  ('Microsoft', 'Software and technology company'),
  ('Apple', 'Consumer electronics and software company'),
  ('Logitech', 'Computer peripherals and software manufacturer')
ON CONFLICT (name) DO NOTHING; 