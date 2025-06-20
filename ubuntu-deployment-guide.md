# STA-CRM Deployment Guide for Ubuntu 24.04 LTS

This guide provides comprehensive, step-by-step instructions for deploying the STA-CRM application on an Ubuntu 24.04 LTS VPS.

## 1. Initial Server Setup

Connect to your VPS using PuTTY and set up the environment:

```bash
# Update system packages
sudo apt update
sudo apt upgrade -y

# Install essential build tools
sudo apt install -y build-essential curl wget git

# Install Node.js using NVM (more reliable than apt)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Install Node.js LTS version (v20.x recommended for this project)
nvm install --lts
node --version  # Should show v20.x.x
npm --version   # Should show v10.x.x

# Install pnpm
npm install -g pnpm
pnpm --version

# Install PM2 for process management
npm install -g pm2

# Install Nginx web server
sudo apt install -y nginx
```

## 2. Clone Your Repository

```bash
# Create and prepare directory with proper permissions
sudo mkdir -p /var/www/stacrm
sudo chown $USER:$USER /var/www/stacrm
cd /var/www/stacrm

# Clone the repository (using your specific GitHub repository)
git clone https://github.com/zaki-mca/STA-CRM-6.git .

# The dot at the end is important - it clones directly into the current directory
# without creating another subdirectory

# If you need to use a specific branch
# git clone -b your-branch-name https://github.com/zaki-mca/stacrm6.git .
```

## 3. Install Dependencies and Build the App

```bash
# Install dependencies for the Next.js app
pnpm install

# Create production build of the front-end
NODE_ENV=production pnpm build

# Install server dependencies
cd server
pnpm install
npm run build  # Build the TypeScript server code
cd ..

# Set proper ownership for the entire application directory
sudo chown -R $USER:$USER /var/www/stacrm
sudo find /var/www/stacrm -type d -exec chmod 755 {} \;
sudo find /var/www/stacrm -type f -exec chmod 644 {} \;
```

## 4. Set Up Environment Variables

```bash
# Create environment file for Next.js front-end
cat > /var/www/stacrm/.env.local << EOL
# API URL (using your VPS IP address)
NEXT_PUBLIC_API_URL=http://64.226.81.92:5000/api
NEXT_PUBLIC_SITE_URL=http://64.226.81.92

# Node environment
NODE_ENV=production

# If using Supabase, add these (otherwise remove)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOL

# Environment variables for server will be set in the PostgreSQL section
# to avoid duplication
```

Replace `YOUR_SERVER_IP` with your actual server IP address or domain name.

## 5. Configure PM2 for Process Management

```bash
# Create PM2 configuration file
cat > /var/www/stacrm/ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'sta-crm-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/stacrm',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
    },
    {
      name: 'sta-crm-backend',
      script: 'node',
      args: 'dist/index.js',
      cwd: '/var/www/stacrm/server',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      watch: false,
      max_memory_restart: '300M',
    },
  ],
};
EOL

# Start the application with PM2
cd /var/www/stacrm
pm2 start ecosystem.config.js

# Save the PM2 configuration to start on system boot
pm2 save

# Setup PM2 to start on system boot (run the command shown in output)
pm2 startup
# Copy and run the command from the output, it will be something like:
# sudo env PATH=$PATH:/home/username/.nvm/versions/node/v20.x.x/bin pm2 startup systemd -u username --hp /home/username
```

## 6. Configure Nginx as Reverse Proxy

```bash
# Create Nginx configuration
sudo tee /etc/nginx/sites-available/stacrm << EOL
server {
    listen 80;
    server_name 64.226.81.92; # Your actual VPS IP address

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
    
    # Frontend Next.js application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffers 16 16k;
        proxy_buffer_size 16k;
    }

    # Backend API server
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffers 16 16k;
        proxy_buffer_size 16k;
    }

    # Larger file uploads
    client_max_body_size 10M;

    # Gzip compression
    gzip on;
    gzip_comp_level 5;
    gzip_min_length 256;
    gzip_proxied any;
    gzip_types
        application/atom+xml
        application/javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rss+xml
        application/vnd.geo+json
        application/vnd.ms-fontobject
        application/x-font-ttf
        application/x-web-app-manifest+json
        application/xhtml+xml
        application/xml
        font/opentype
        image/bmp
        image/svg+xml
        image/x-icon
        text/cache-manifest
        text/css
        text/plain
        text/vcard
        text/vnd.rim.location.xloc
        text/vtt
        text/x-component
        text/x-cross-domain-policy;
}
EOL

# IP is already set in the configuration
# No need to run sed command as we've directly specified 64.226.81.92

# Enable the site and check configuration
sudo ln -s /etc/nginx/sites-available/stacrm /etc/nginx/sites-enabled/
sudo unlink /etc/nginx/sites-enabled/default  # Remove default site
sudo nginx -t  # Test configuration

# If test passes, restart Nginx
sudo systemctl restart nginx
```

## 7. Set Up SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# If using a domain name (not just an IP address)
sudo certbot --nginx -d 64.226.81.92
# Follow the prompts to complete SSL setup
```

> Note: SSL setup requires a valid domain name pointed to your server's IP address.
> If you're just using an IP address directly, skip this step.



## 8. Setup Automatic Deployment with GitHub Webhook (Optional)

Create a simple deployment script:

```bash
cat > /var/www/deploy.sh << EOL
#!/bin/bash
cd /var/www/stacrm6.0
git pull
pnpm install
pnpm build
cd server
pnpm install
cd ..
pm2 restart all
EOL

chmod +x /var/www/deploy.sh
```

## 9. Database Setup

Your STA-CRM application requires PostgreSQL as indicated by the codebase using the 'pg' Node.js client. Follow these steps to set it up:

```bash
# Install PostgreSQL 16 (latest stable version)
sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
sudo apt update
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql
sudo systemctl status postgresql  # Verify it's running

# Secure PostgreSQL installation
# Connect to PostgreSQL as postgres user
sudo -i -u postgres
psql

# Inside PostgreSQL prompt, create database and users
# Note: You should replace 'strong_password' with an actual strong password
CREATE DATABASE stacrm;
CREATE USER stacrm_user WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE stacrm TO stacrm_user;
ALTER USER stacrm_user WITH SUPERUSER;
\q
exit

# Configure PostgreSQL to allow local connections
sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add or modify these lines in pg_hba.conf:
```
# TYPE  DATABASE        USER            ADDRESS                 METHOD
host    stacrm          stacrm_user     127.0.0.1/32            md5
host    stacrm          stacrm_user     ::1/128                 md5
```

Then continue with:
```bash
# Import your schema
cd /var/www/stacrm/server
sudo -u postgres psql stacrm < src/db/schema.sql

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql
```

### Setting Up PostgreSQL Environment Variables

Create the server environment file with the correct PostgreSQL connection details:

```bash
# Create server environment file
cat > /var/www/stacrm/server/.env << EOL
# Database Configuration
DATABASE_URL=postgresql://stacrm_user:postgres@localhost:5432/stacrm
PGUSER=stacrm_user
PGHOST=localhost
PGPASSWORD=postgres
PGDATABASE=stacrm
PGPORT=5432

# Server Configuration
PORT=5000
NODE_ENV=production

# JWT Configuration (generate a new secret with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
JWT_SECRET=0182118f76d495a9729c53d51b37199e7407e7a6b1ea1117ca780c3314a28d938927e8548cd7d8a1039106cacad4c115effc7ff4c0bb62d0b074897c4efee1ceb99aa2d031e45ceb3ac48cf4452d95f1dc98cd1906d69a071ed535376aeb1d780a4671e0ba66d3f9d064f5701b866a6b2a0284129ae86f37b50659f59b7c394c5fe0cdcb1d4fbcd0123223b413cd2f88410f01693c58f13007cd24b0ecfb54f829541e7639f6041699e4ea8aa219012b10e07798f3f5537986941121d69825a8dee5fdc3660f25bfb8829a85093959edb5f14ad66dd5c4654e55c03de46d57139b6c4573e353df8f4a5c9c46c98ec41c20b17074fb94d1357994b29e6bb8bcb3
JWT_EXPIRES_IN=1d
EOL
```

Remember to replace 'strong_password' with your actual password and generate a real JWT secret for production.

## 10. Firewall Configuration

Set up UFW (Uncomplicated Firewall) to secure your server while allowing necessary connections:

```bash
# Install UFW if not already installed
sudo apt install -y ufw

# Set default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (important to prevent lockout!)
sudo ufw allow ssh

# Allow Nginx HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Enable the firewall
sudo ufw enable

# Check status
sudo ufw status
```

## 11. Final Steps and Testing

```bash
# Set up log rotation for PM2
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7

# Verify both applications are running
pm2 list
pm2 logs

# Restart server to ensure everything starts properly on boot
sudo reboot
```

After reboot, check that everything is running:

```bash
# SSH back into the server
# Wait about 30-60 seconds after reboot

# Check if PM2 processes are running
pm2 list

# Check if Nginx is running
sudo systemctl status nginx

# Check if PostgreSQL is running
sudo systemctl status postgresql
```

Now test your application by visiting http://64.226.81.92 in a web browser.

## Troubleshooting

### Common Issues and Solutions

#### 1. 403 Forbidden Nginx Error
If you see a 403 Forbidden error when accessing your site:

```bash
# Check file permissions
sudo chmod 755 /var/www
sudo chmod -R 755 /var/www/stacrm
sudo chown -R $USER:$USER /var/www/stacrm
sudo chown -R www-data:www-data /var/www/stacrm/.next

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify Nginx configuration
sudo nginx -t
```

#### 2. Connection Refused Errors

If you can't connect to your application:

```bash
# Check if the processes are running
pm2 list
ps aux | grep node

# Check if the ports are being used
sudo netstat -tuln | grep '3000\|5000'

# Restart the services
pm2 restart all
sudo systemctl restart nginx
```

#### 3. Database Connection Issues

If your application can't connect to the database:

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log

# Test database connection manually
sudo -u postgres psql -d stacrm -c "SELECT 1;"

# Verify PostgreSQL is listening on expected ports
sudo netstat -tuln | grep 5432

# Check your .env file settings
cat /var/www/stacrm/server/.env
```

#### 4. Node.js Version or Module Issues

```bash
# Check Node.js version
node -v

# If needed, install a different version
nvm install 20  # or preferred version
nvm use 20

# Clear npm/pnpm cache and reinstall
cd /var/www/stacrm
pnpm store prune
rm -rf node_modules
pnpm install

# Check for TypeScript errors in server
cd /var/www/stacrm/server
npm run build
```

#### 5. Permission Issues with File Uploads

```bash
# Create uploads directory with proper permissions
sudo mkdir -p /var/www/stacrm/server/uploads
sudo chmod 755 /var/www/stacrm/server/uploads
sudo chown -R $USER:www-data /var/www/stacrm/server/uploads
```

#### 6. Checking Logs

```bash
# PM2 logs
pm2 logs

# Next.js frontend logs
pm2 logs sta-crm-frontend

# Express backend logs
pm2 logs sta-crm-backend

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

## Maintenance

### Regular Maintenance Tasks

#### Application Updates

```bash
# Navigate to application directory
cd /var/www/stacrm

# Create a backup before updating (optional)
sudo cp -r /var/www/stacrm /var/www/stacrm_backup_$(date +"%Y%m%d")

# Pull latest code
git pull

# Install dependencies and rebuild frontend
pnpm install
NODE_ENV=production pnpm build

# Update server dependencies and rebuild
cd server
pnpm install
npm run build
cd ..

# Restart the application
pm2 restart all

# Check for errors after update
pm2 logs
```

#### System Updates

```bash
# Update package lists
sudo apt update

# Upgrade system packages
sudo apt upgrade -y

# Remove unused packages
sudo apt autoremove -y

# Check disk space
df -h
```

#### Database Backups

```bash
# Create backup directory if it doesn't exist
sudo mkdir -p /var/backups/postgresql

# Set proper permissions
sudo chmod 700 /var/backups/postgresql

# Create a database backup with date
sudo -u postgres pg_dump stacrm > /var/backups/postgresql/stacrm_$(date +"%Y%m%d").sql

# To automate backups, add to crontab:
# 0 1 * * * sudo -u postgres pg_dump stacrm > /var/backups/postgresql/stacrm_$(date +"\%Y\%m\%d").sql
```

#### Restore from Backup

```bash
# If you need to restore from a backup
sudo -u postgres psql -c "DROP DATABASE IF EXISTS stacrm;"
sudo -u postgres psql -c "CREATE DATABASE stacrm;"
sudo -u postgres psql stacrm < /var/backups/postgresql/stacrm_YYYYMMDD.sql

# Restart server after restoration
pm2 restart sta-crm-backend
```

#### Monitoring

```bash
# Check server resources
htop  # Install with: sudo apt install htop

# Check disk space
df -h

# Check running services
sudo systemctl status postgresql nginx

# View real-time logs
pm2 logs --lines 100
```

#### Security Maintenance

```bash
# Check for failed login attempts
sudo grep "Failed password" /var/log/auth.log

# Check open ports
sudo netstat -tulpn

# Update firewall rules if needed
sudo ufw status
```