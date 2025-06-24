# STA-CRM Deployment Guide

This guide provides step-by-step instructions for deploying the STA-CRM application on a VPS running Ubuntu with the following configuration:

- VPS IP Address: 167.172.187.42
- Database: PostgreSQL
- Database Name: stacrmdb
- Database User: stacrmuser
- Database Password: postgres

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Server Setup](#initial-server-setup)
3. [Install Required Software](#install-required-software)
4. [Configure PostgreSQL](#configure-postgresql)
5. [Deploy Backend (API Server)](#deploy-backend-api-server)
6. [Deploy Frontend (Next.js)](#deploy-frontend-nextjs)
7. [Configure Nginx](#configure-nginx)
8. [Set Up SSL with Let's Encrypt](#set-up-ssl-with-lets-encrypt)
9. [Configure Firewall](#configure-firewall)
10. [Set Up PM2 for Process Management](#set-up-pm2-for-process-management)
11. [Testing the Deployment](#testing-the-deployment)
12. [Troubleshooting](#troubleshooting)
13. [Enhanced Error Handling](#enhanced-error-handling)
14. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- SSH access to your VPS
- A domain name pointing to your VPS IP address (optional but recommended for SSL)
- Basic knowledge of Linux command line

## Initial Server Setup

1. Connect to your VPS via SSH:

```bash
ssh root@167.172.187.42
```

2. Update system packages:

```bash
apt update && apt upgrade -y
```

3. Create a new non-root user with sudo privileges:

```bash
adduser stacrm
usermod -aG sudo stacrm
```

4. Set up SSH key authentication for the new user (optional but recommended):

```bash
# On your local machine:
ssh-copy-id stacrm@167.172.187.42

# Or manually copy your public key to the server:
mkdir -p /home/stacrm/.ssh
nano /home/stacrm/.ssh/authorized_keys
# Paste your public key and save

# Set proper permissions
chmod 700 /home/stacrm/.ssh
chmod 600 /home/stacrm/.ssh/authorized_keys
chown -R stacrm:stacrm /home/stacrm/.ssh
```

5. Configure SSH for security (optional):

```bash
nano /etc/ssh/sshd_config
```

Make the following changes:
- Change `PermitRootLogin` to `no`
- Set `PasswordAuthentication` to `no`
- Ensure `PubkeyAuthentication` is `yes`

Restart SSH service:

```bash
systemctl restart sshd
```

## Install Required Software

1. Install Node.js and npm:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

2. Install PostgreSQL:

```bash
sudo apt install -y postgresql postgresql-contrib
```

3. Install Nginx:

```bash
sudo apt install -y nginx
```

4. Install other dependencies:

```bash
sudo apt install -y git build-essential
```

## Configure PostgreSQL

1. Start and enable PostgreSQL:

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. Create database and user:

```bash
sudo -i -u postgres psql -c "CREATE USER stacrmuser WITH PASSWORD 'postgres';"
sudo -i -u postgres psql -c "CREATE DATABASE stacrmdb OWNER stacrmuser;"
sudo -i -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE stacrmdb TO stacrmuser;"
```

3. Enable remote connections (if needed):

```bash
sudo nano /etc/postgresql/*/main/postgresql.conf
```

Uncomment and modify:
```
listen_addresses = '*'
```

Then edit pg_hba.conf:
```bash
sudo nano /etc/postgresql/*/main/pg_hba.conf
```

Add at the end:
```
host    stacrmdb    stacrmuser    0.0.0.0/0    md5
```

4. Restart PostgreSQL:

```bash
sudo systemctl restart postgresql
```

## Deploy Backend (API Server)

1. Clone the repository:

```bash
sudo mkdir -p /var/www
sudo chown stacrm:stacrm /var/www
cd /var/www
git clone https://github.com/your-repo/STA-CRM-6.0.git sta-crm
cd sta-crm
```

2. Install backend dependencies:

```bash
cd server
npm install
```

3. Create a `.env` file for the backend:

```bash
cp .env.example .env
nano .env
```

Add the following configuration (adjust as needed):

```
# Node environment: development, production, or test
NODE_ENV=production

# Server configuration
PORT=5000
API_URL=http://167.172.187.42/api

# Database connection - PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=stacrmdb
DB_USER=stacrmuser
DB_PASSWORD=postgres

# Alternative: Full connection string (if you prefer)
DATABASE_URL=postgres://stacrmuser:postgres@localhost:5432/stacrmdb

# JWT Authentication
JWT_SECRET=your_strong_random_jwt_secret_key
JWT_EXPIRES_IN=7d

# Logging configuration
LOG_LEVEL=info

# File upload limits
MAX_FILE_SIZE=10
UPLOAD_DIR=./uploads

# CORS settings
CORS_ORIGIN=http://167.172.187.42

# Default admin user (created on first run if no admin exists)
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=adminpassword

# Connection retry settings
DB_CONNECTION_RETRIES=5
DB_CONNECTION_RETRY_DELAY=5000
```

Replace `your_strong_random_jwt_secret_key` with a secure random string. You can generate one with:

```bash
openssl rand -base64 32
```

4. Set up the database schema:

```bash
npx ts-node src/db/setupDb.ts
```

5. Build the backend:

```bash
npm run build
```

## Deploy Frontend (Next.js)

1. Navigate to the frontend directory:

```bash
cd /var/www/sta-crm
```

2. Install frontend dependencies:

```bash
npm install
```

3. Create a `.env.local` file for the frontend:

```bash
nano .env.local
```

Add the following configuration:

```
NEXT_PUBLIC_API_URL=http://167.172.187.42/api
```

4. Build the frontend:

```bash
npm run build
```

## Configure Nginx

1. Create an Nginx configuration file for the application:

```bash
sudo nano /etc/nginx/sites-available/sta-crm
```

2. Add the following configuration (for IP-only setup):

```nginx
server {
    listen 80;
    server_name 167.172.187.42;

    # For handling large file uploads
    client_max_body_size 20M;

    # Frontend routes
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API routes - IMPORTANT: This must be before the / location
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Add longer timeouts for API requests
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint - ensure this is accessible at both paths for compatibility
    location /health {
        proxy_pass http://localhost:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Also make health check accessible at /api/health for frontend compatibility
    location /api/health {
        proxy_pass http://localhost:5000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

3. Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/sta-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default  # Remove default site if it exists
sudo nginx -t  # Test the configuration
sudo systemctl restart nginx
```

## Set Up SSL with Let's Encrypt

If you're using a domain (recommended):

1. Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

2. Obtain and install certificates:

```bash
sudo certbot --nginx -d yourdomain.com
```

3. Follow the prompts and choose to redirect HTTP to HTTPS

## Configure Firewall

1. Set up a firewall with UFW:

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## Set Up PM2 for Process Management

1. Install PM2 globally:

```bash
sudo npm install -g pm2
```

2. Create a PM2 configuration file:

```bash
nano /var/www/sta-crm/ecosystem.config.js
```

Add the following content:

```javascript
module.exports = {
  apps: [
    {
      name: 'sta-crm-api',
      cwd: '/var/www/sta-crm/server',
      script: 'dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/sta-crm-api-error.log',
      out_file: '/var/log/pm2/sta-crm-api-out.log',
      merge_logs: true,
    },
    {
      name: 'sta-crm-frontend',
      cwd: '/var/www/sta-crm',
      script: 'node_modules/next/dist/bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/var/log/pm2/sta-crm-frontend-error.log',
      out_file: '/var/log/pm2/sta-crm-frontend-out.log',
      merge_logs: true,
    },
  ],
};
```

3. Create log directory:

```bash
sudo mkdir -p /var/log/pm2
sudo chown stacrm:stacrm /var/log/pm2
```

4. Start the application with PM2:

```bash
cd /var/www/sta-crm
pm2 start ecosystem.config.js
```

5. Save the PM2 process list to start on reboot:

```bash
pm2 save
pm2 startup
# Follow the instructions provided by the above command
```

## Testing the Deployment

1. Test the API server health endpoint:

```bash
curl http://localhost:5000/health
```

You should see a response like:
```json
{
  "status": "ok",
  "timestamp": "2023-07-24T12:34:56.789Z",
  "db": {
    "healthy": true,
    "details": "Database connection successful"
  }
}
```

2. Access the frontend application:
   - Open a web browser and navigate to your IP address: http://167.172.187.42
   - The application should load with the login page
   - Test login functionality with default admin credentials

## Troubleshooting

### Database Connection Issues

If you encounter database connection issues:

1. Check PostgreSQL is running:

```bash
sudo systemctl status postgresql
```

2. Verify database connection details:

```bash
cd /var/www/sta-crm/server
cat .env  # Make sure connection details are correct
```

3. Test PostgreSQL connection:

```bash
psql -h localhost -U stacrmuser -d stacrmdb
# Enter password when prompted
```

4. Check PostgreSQL logs:

```bash
sudo tail -f /var/log/postgresql/postgresql-*.log
```

5. Check if the database schema was properly created:

```bash
psql -U stacrmuser -d stacrmdb -c "\dt"
```

6. Verify database user permissions:

```bash
sudo -u postgres psql -c "\du stacrmuser"
```

### API Server Issues

1. Check PM2 logs:

```bash
pm2 logs sta-crm-api
# Or check the log files directly
cat /var/log/pm2/sta-crm-api-error.log
cat /var/log/pm2/sta-crm-api-out.log
```

2. Test API health endpoint directly:

```bash
curl http://localhost:5000/health
```

3. Check environment variables:

```bash
cd /var/www/sta-crm/server
cat .env
```

4. Restart the API server:

```bash
pm2 restart sta-crm-api
```

### Frontend Issues

1. Check PM2 logs:

```bash
pm2 logs sta-crm-frontend
# Or check the log files directly
cat /var/log/pm2/sta-crm-frontend-error.log
cat /var/log/pm2/sta-crm-frontend-out.log
```

2. Verify the frontend is running:

```bash
curl http://localhost:3000
```

3. Check environment variables:

```bash
cd /var/www/sta-crm
cat .env.local
```

4. Restart the frontend:

```bash
pm2 restart sta-crm-frontend
```

### Nginx Issues

1. Test Nginx configuration:

```bash
sudo nginx -t
```

2. Check Nginx status:

```bash
sudo systemctl status nginx
```

3. Check Nginx error logs:

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

4. Restart Nginx if needed:

```bash
sudo systemctl restart nginx
```

### Common Error Messages and Solutions

1. **"Request timed out" errors in browser console**:
   - Check if API server is running: `pm2 status`
   - Check database connection in API logs: `pm2 logs sta-crm-api`
   - Verify Nginx proxy settings for `/api` location
   - Increase proxy timeouts in Nginx config if needed

2. **"CORS error" in browser console**:
   - Ensure `CORS_ORIGIN` in server `.env` matches your frontend URL
   - Check Nginx configuration for proper headers
   - Verify API routes are correctly proxied through Nginx

3. **Database authentication errors**:
   - Verify database credentials in `.env` file
   - Check PostgreSQL logs for authentication failures
   - Ensure PostgreSQL is configured to accept password authentication

4. **"Cannot connect to API server" error**:
   - Check if API server is running with PM2: `pm2 status`
   - Verify firewall allows traffic to the API port
   - Check Nginx proxy configuration for the API endpoint

## Enhanced Error Handling

The application includes improved error handling mechanisms that help identify and resolve issues:

### Health Check Endpoint

The API server provides a `/health` endpoint that reports on the health of the server and database connection. You can access it at:

```
http://167.172.187.42/health
```

This endpoint returns detailed information about the database connection status and can help diagnose issues.

### Automatic Retry Logic

The application includes automatic retry logic for database connections and API requests:

1. **Backend Database Connection**: The server will automatically attempt to reconnect to the database if the connection is lost, with configurable retry settings in the `.env` file.

2. **Frontend API Requests**: The frontend includes automatic retry logic for failed API requests, with exponential backoff to avoid overwhelming the server.

### Network Status Component

The frontend includes a NetworkStatus component that monitors the connection to the API server and displays alerts when issues are detected. It also provides a manual retry button for users.

## Monitoring and Maintenance

### Log Rotation

Set up log rotation for PM2 logs:

```bash
sudo nano /etc/logrotate.d/pm2-stacrm
```

Add the following content:

```
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0640 stacrm stacrm
    postrotate
        pm2 flush
    endscript
}
```

### Database Backup

Set up regular database backups:

```bash
sudo mkdir -p /var/backups/stacrm-db
sudo nano /etc/cron.daily/backup-stacrm-db
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/stacrm-db"
TIMESTAMP=$(date +"%Y-%m-%d-%H%M")
BACKUP_FILE="$BACKUP_DIR/stacrm-db-$TIMESTAMP.sql"

# Create the backup
sudo -u postgres pg_dump stacrmdb > $BACKUP_FILE

# Compress the backup
gzip $BACKUP_FILE

# Remove backups older than 7 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +7 -delete
```

Make the script executable:

```bash
sudo chmod +x /etc/cron.daily/backup-stacrm-db
```

### Application Updates

To update the application:

```bash
cd /var/www/sta-crm
git pull
npm install
npm run build
cd server
npm install
npm run build
pm2 restart all
```

### Monitoring System Health

Set up a simple monitoring script:

```bash
sudo nano /etc/cron.hourly/check-stacrm-health
```

Add the following content:

```bash
#!/bin/bash
LOG_FILE="/var/log/stacrm-health.log"
API_URL="http://localhost:5000/health"
ADMIN_EMAIL="your-email@example.com"

# Check if services are running
PM2_STATUS=$(pm2 jlist | grep -c "online")
NGINX_STATUS=$(systemctl is-active nginx)
PG_STATUS=$(systemctl is-active postgresql)

# Check API health
API_HEALTH=$(curl -s $API_URL)
DB_HEALTHY=$(echo $API_HEALTH | grep -c "healthy\":true")

# Log status
echo "$(date): PM2 processes online: $PM2_STATUS, Nginx: $NGINX_STATUS, PostgreSQL: $PG_STATUS, DB Healthy: $DB_HEALTHY" >> $LOG_FILE

# Alert if any service is down
if [ "$PM2_STATUS" -lt "2" ] || [ "$NGINX_STATUS" != "active" ] || [ "$PG_STATUS" != "active" ] || [ "$DB_HEALTHY" -eq "0" ]; then
  echo "Alert: STA-CRM system issue detected on $(hostname) at $(date)" | mail -s "STA-CRM Health Alert" $ADMIN_EMAIL
fi
```

Make the script executable:

```bash
sudo chmod +x /etc/cron.hourly/check-stacrm-health
```

---

Congratulations! Your STA-CRM application should now be successfully deployed on your VPS with enhanced error handling and monitoring capabilities. 