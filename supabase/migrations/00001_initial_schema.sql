-- Create schema for STA-CRM 6.0

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create ENUM types
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'order_status') THEN
        CREATE TYPE order_status AS ENUM ('pending', 'processing', 'completed', 'cancelled');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE payment_status AS ENUM ('unpaid', 'partial', 'paid');
    END IF;
END $$;

-- Professional domains
CREATE TABLE IF NOT EXISTS professional_domains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  payment_code VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT
);

-- Providers
CREATE TABLE IF NOT EXISTS providers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_name VARCHAR(255),
  notes TEXT,
  preferred_payment_method VARCHAR(100),
  payment_terms VARCHAR(100),
  tax_id VARCHAR(100)
);

-- Clients
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  display_name VARCHAR(255),
  company_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  birth_date DATE,
  professional_domain_id INTEGER REFERENCES professional_domains(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  referrer VARCHAR(255),
  preferred_contact_method VARCHAR(50),
  communication_preferences TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  CONSTRAINT validate_display_name_not_null CHECK ((first_name IS NOT NULL AND last_name IS NOT NULL) OR display_name IS NOT NULL)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  sku VARCHAR(100),
  category_id INTEGER REFERENCES categories(id),
  brand_id INTEGER REFERENCES brands(id),
  price DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  cost_price DECIMAL(10, 2) DEFAULT 0 NOT NULL,
  stock_level INTEGER DEFAULT 0,
  min_stock_level INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  image_url TEXT,
  barcode VARCHAR(100),
  provider_id INTEGER REFERENCES providers(id),
  weight DECIMAL(10, 2),
  dimensions VARCHAR(100),
  tax_rate DECIMAL(5, 2),
  is_active BOOLEAN DEFAULT TRUE,
  is_service BOOLEAN DEFAULT FALSE,
  unit_of_measure VARCHAR(50),
  availability_status VARCHAR(50),
  discount_price DECIMAL(10, 2),
  discount_start_date TIMESTAMPTZ,
  discount_end_date TIMESTAMPTZ,
  is_featured BOOLEAN DEFAULT FALSE,
  is_taxable BOOLEAN DEFAULT TRUE
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  order_date TIMESTAMPTZ DEFAULT NOW(),
  status order_status DEFAULT 'pending',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  payment_method VARCHAR(100),
  payment_status payment_status DEFAULT 'unpaid',
  payment_date TIMESTAMPTZ,
  shipped_date TIMESTAMPTZ,
  tracking_number VARCHAR(100),
  shipping_address TEXT,
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  completed_date TIMESTAMPTZ,
  cancelled_date TIMESTAMPTZ,
  cancellation_reason TEXT,
  expected_delivery_date TIMESTAMPTZ
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  returned_quantity INTEGER DEFAULT 0,
  return_reason TEXT,
  is_gift BOOLEAN DEFAULT FALSE
);

-- Order Logs
CREATE TABLE IF NOT EXISTS order_logs (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  assigned_to VARCHAR(255),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open'
);

-- Order Log Entries
CREATE TABLE IF NOT EXISTS order_log_entries (
  id SERIAL PRIMARY KEY,
  order_log_id INTEGER REFERENCES order_logs(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  attachment_url TEXT,
  entry_type VARCHAR(50) DEFAULT 'note'
);

-- Client Logs
CREATE TABLE IF NOT EXISTS client_logs (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id) ON DELETE CASCADE,
  log_date TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  assigned_to VARCHAR(255),
  priority VARCHAR(50) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open'
);

-- Client Log Entries
CREATE TABLE IF NOT EXISTS client_log_entries (
  id SERIAL PRIMARY KEY,
  client_log_id INTEGER REFERENCES client_logs(id) ON DELETE CASCADE,
  entry_date TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT NOT NULL,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  attachment_url TEXT,
  entry_type VARCHAR(50) DEFAULT 'note'
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  provider_id INTEGER REFERENCES providers(id),
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  status payment_status DEFAULT 'unpaid',
  total_amount DECIMAL(10, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  payment_method VARCHAR(100),
  payment_date TIMESTAMPTZ,
  pdf_url TEXT,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_terms VARCHAR(100),
  client_id INTEGER REFERENCES clients(id)
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  product_id INTEGER REFERENCES products(id),
  item_code VARCHAR(100),
  unit_of_measure VARCHAR(50)
);

-- Create users table if auth schema doesn't exist (for Supabase auth integration)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      last_login TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE,
      reset_token VARCHAR(255),
      reset_token_expires TIMESTAMPTZ
    );
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_professional_domain_id ON clients(professional_domain_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand_id ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_products_provider_id ON products(provider_id);
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_logs_order_id ON order_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_order_log_entries_order_log_id ON order_log_entries(order_log_id);
CREATE INDEX IF NOT EXISTS idx_client_logs_client_id ON client_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_client_log_entries_client_log_id ON client_log_entries(client_log_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product_id ON invoice_items(product_id);

-- Create triggers for updated_at timestamp handling
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE
  t text;
BEGIN
  FOR t IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_timestamp ON %s;
      CREATE TRIGGER update_%s_timestamp
      BEFORE UPDATE ON %s
      FOR EACH ROW
      EXECUTE FUNCTION update_timestamp();
    ', t, t, t, t);
  END LOOP;
END $$; 