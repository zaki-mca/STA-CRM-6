-- Create UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist
DROP TABLE IF EXISTS client_logs CASCADE;
DROP TABLE IF EXISTS order_logs CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS providers CASCADE;
DROP TABLE IF EXISTS product_categories CASCADE;
DROP TABLE IF EXISTS product_brands CASCADE;
DROP TABLE IF EXISTS professional_domains CASCADE;

-- Create professional_domains table
CREATE TABLE professional_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  payment_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create product_categories table
CREATE TABLE product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create product_brands table
CREATE TABLE product_brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  logo_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create clients table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  name VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  gender VARCHAR(50),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  company VARCHAR(255),
  professional_domain_id UUID REFERENCES professional_domains(id),
  birth_date DATE,
  ccp_account VARCHAR(100),
  cle VARCHAR(100),
  rip VARCHAR(100),
  rip_cle VARCHAR(100),
  revenue DECIMAL(12, 2),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'lead',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create providers table
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  contact_person VARCHAR(255),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  sell_price DECIMAL(10, 2),
  buy_price DECIMAL(10, 2),
  quantity INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES product_categories(id),
  brand_id UUID REFERENCES product_brands(id),
  sku VARCHAR(100) UNIQUE,
  reference VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id),
  provider_id UUID REFERENCES providers(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  status VARCHAR(50) DEFAULT 'draft',
  notes TEXT,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT check_entity_reference CHECK (
    (client_id IS NOT NULL AND provider_id IS NULL) OR 
    (client_id IS NULL AND provider_id IS NOT NULL)
  )
);

-- Create invoice_items table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id),
  order_number VARCHAR(50) UNIQUE NOT NULL,
  order_date DATE NOT NULL,
  expected_delivery DATE,
  status VARCHAR(50) DEFAULT 'pending',
  notes TEXT,
  shipping_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create client_logs table
CREATE TABLE client_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  log_date DATE NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_logs table
CREATE TABLE order_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  description TEXT NOT NULL,
  log_date DATE NOT NULL,
  user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP WITH TIME ZONE
);

-- Create order_log_entries table
CREATE TABLE order_log_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_log_id UUID NOT NULL REFERENCES order_logs(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  notes TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(order_log_id, order_id)
);

-- Create indices for better performance
CREATE INDEX idx_clients_professional_domain ON clients(professional_domain_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_invoices_client ON invoices(client_id);
CREATE INDEX idx_invoices_provider ON invoices(provider_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX idx_orders_client ON orders(client_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_client_logs_client ON client_logs(client_id);
CREATE INDEX idx_client_logs_date ON client_logs(log_date);
CREATE INDEX idx_order_logs_date ON order_logs(log_date);
CREATE INDEX idx_order_log_entries_log_id ON order_log_entries(order_log_id);
CREATE INDEX idx_order_log_entries_order_id ON order_log_entries(order_id);

-- Insert sample data for professional_domains
INSERT INTO professional_domains (name, description, payment_code) VALUES
  ('IT', 'Information Technology', 'IT-PAY'),
  ('Healthcare', 'Medical and healthcare services', 'HC-PAY'),
  ('Education', 'Educational institutions and services', 'EDU-PAY'),
  ('Manufacturing', 'Manufacturing and production', 'MFG-PAY'),
  ('Retail', 'Retail and commerce', 'RET-PAY');

-- Insert sample data for product_categories
INSERT INTO product_categories (name, description) VALUES
  ('Electronics', 'Electronic devices and accessories'),
  ('Office Supplies', 'Office stationery and supplies'),
  ('Furniture', 'Office and home furniture'),
  ('Software', 'Software licenses and subscriptions'),
  ('Hardware', 'Computer hardware and components');

-- Insert sample data for product_brands
INSERT INTO product_brands (name, description) VALUES
  ('Dell', 'Computer and technology hardware manufacturer'),
  ('HP', 'Hewlett-Packard technology company'),
  ('Microsoft', 'Software and technology company'),
  ('Apple', 'Consumer electronics and software company'),
  ('Logitech', 'Computer peripherals and software manufacturer');

-- Insert sample data for clients
INSERT INTO clients (first_name, last_name, email, phone, company, professional_domain_id, status) VALUES
  ('John', 'Doe', 'john@example.com', '555-1234', 'ABC Corp', (SELECT id FROM professional_domains WHERE name = 'IT'), 'active'),
  ('Jane', 'Smith', 'jane@example.com', '555-5678', 'XYZ Ltd', (SELECT id FROM professional_domains WHERE name = 'Healthcare'), 'lead'),
  ('Bob', 'Johnson', 'bob@example.com', '555-9012', 'Acme Inc', (SELECT id FROM professional_domains WHERE name = 'Manufacturing'), 'prospect'),
  ('Alice', 'Brown', 'alice@example.com', '555-3456', 'Tech Solutions', (SELECT id FROM professional_domains WHERE name = 'IT'), 'inactive'),
  ('Charlie', 'Davis', 'charlie@example.com', '555-7890', 'Davis Enterprises', (SELECT id FROM professional_domains WHERE name = 'Retail'), 'active');

-- Insert sample data for providers
INSERT INTO providers (name, email, phone, contact_person, status) VALUES
  ('Supplier Co', 'contact@supplierco.com', '555-2468', 'Sarah Johnson', 'active'),
  ('Tech Parts Inc', 'info@techparts.com', '555-1357', 'Mike Wilson', 'active'),
  ('Office Depot', 'sales@officedepot.com', '555-3698', 'Lisa Brown', 'active'),
  ('Global Solutions', 'contact@globalsolutions.com', '555-9876', 'Robert Lee', 'inactive'),
  ('Local Vendors Ltd', 'info@localvendors.com', '555-5432', 'Emma Davis', 'active');

-- Insert sample data for products
INSERT INTO products (name, description, price, sell_price, buy_price, quantity, category_id, brand_id, sku, reference) VALUES
  ('Laptop Pro', '15-inch laptop with i7 processor', 1299.99, 1499.99, 999.99, 25, (SELECT id FROM product_categories WHERE name = 'Electronics'), (SELECT id FROM product_brands WHERE name = 'Dell'), 'LP-001', 'REF-LP001'),
  ('Office Chair', 'Ergonomic office chair', 249.99, 299.99, 199.99, 50, (SELECT id FROM product_categories WHERE name = 'Furniture'), NULL, 'OC-001', 'REF-OC001'),
  ('Windows 11 Pro', 'Operating system license', 199.99, 219.99, 179.99, 100, (SELECT id FROM product_categories WHERE name = 'Software'), (SELECT id FROM product_brands WHERE name = 'Microsoft'), 'W11-001', 'REF-W11001'),
  ('Wireless Mouse', 'Bluetooth wireless mouse', 39.99, 49.99, 29.99, 75, (SELECT id FROM product_categories WHERE name = 'Electronics'), (SELECT id FROM product_brands WHERE name = 'Logitech'), 'WM-001', 'REF-WM001'),
  ('Desktop Computer', 'Desktop workstation with i5 processor', 899.99, 999.99, 799.99, 15, (SELECT id FROM product_categories WHERE name = 'Electronics'), (SELECT id FROM product_brands WHERE name = 'HP'), 'DC-001', 'REF-DC001'); 