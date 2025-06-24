-- Add users and permissions tables

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create user_permissions junction table
CREATE TABLE IF NOT EXISTS user_permissions (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, permission_id)
);

-- Create indices for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_id ON user_permissions(permission_id);

-- Insert default permissions
INSERT INTO permissions (name, description) VALUES
    ('create:brands', 'Create new brands'),
    ('read:brands', 'View brands'),
    ('update:brands', 'Update existing brands'),
    ('delete:brands', 'Delete brands'),
    ('create:categories', 'Create new categories'),
    ('read:categories', 'View categories'),
    ('update:categories', 'Update existing categories'),
    ('delete:categories', 'Delete categories'),
    ('create:products', 'Create new products'),
    ('read:products', 'View products'),
    ('update:products', 'Update existing products'),
    ('delete:products', 'Delete products'),
    ('create:orders', 'Create new orders'),
    ('read:orders', 'View orders'),
    ('update:orders', 'Update existing orders'),
    ('delete:orders', 'Delete orders'),
    ('create:clients', 'Create new clients'),
    ('read:clients', 'View clients'),
    ('update:clients', 'Update existing clients'),
    ('delete:clients', 'Delete clients'),
    ('create:providers', 'Create new providers'),
    ('read:providers', 'View providers'),
    ('update:providers', 'Update existing providers'),
    ('delete:providers', 'Delete providers'),
    ('manage:users', 'Manage user accounts'),
    ('view:reports', 'View reports and analytics');

-- Create default admin user with password 'admin123' (you should change this in production)
INSERT INTO users (username, email, password_hash, first_name, last_name, is_admin)
VALUES (
    'admin',
    'admin@stacrm.com',
    '$2b$12$K8HKz.Nt4YwEXxkRwGqDt.FPq8yFHEfv1PMxL3jJyKtZyUUPXZpDO', -- 'admin123' hashed with bcrypt
    'Admin',
    'User',
    true
);

-- Grant all permissions to admin user
INSERT INTO user_permissions (user_id, permission_id)
SELECT 
    (SELECT id FROM users WHERE email = 'admin@stacrm.com'),
    id
FROM permissions; 