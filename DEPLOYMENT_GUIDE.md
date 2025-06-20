# Deployment Guide for STA-CRM Application

This guide provides detailed steps to deploy the STA-CRM application on an Ubuntu VPS with IP address 64.226.80.247.

## Step 1: Initial Server Setup

1. **Connect to Your VPS**
   - Use SSH to connect to your VPS:
     ```bash
     ssh root@64.226.80.247
     ```

2. **Update System Packages**
   - Update and upgrade the system packages:
     ```bash
     sudo apt update
     sudo apt upgrade -y
     ```

3. **Install Essential Build Tools**
   - Install necessary build tools:
     ```bash
     sudo apt install -y build-essential curl wget git
     ```

## Step 2: Install Node.js

1. **Install Node.js Using NVM**
   - Install NVM and Node.js LTS version:
     ```bash
     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
     source ~/.bashrc
     nvm install --lts
     node --version  # Should show v20.x.x
     npm --version   # Should show v10.x.x
     ```

2. **Install pnpm and PM2**
   - Install pnpm and PM2 globally:
     ```bash
     npm install -g pnpm
     pnpm --version
     npm install -g pm2
     ```

## Step 3: Install PostgreSQL

1. **Install PostgreSQL**
   - Add PostgreSQL repository and install:
     ```bash
     sudo sh -c 'echo "deb https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
     wget -qO- https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo tee /etc/apt/trusted.gpg.d/pgdg.asc &>/dev/null
     sudo apt update
     sudo apt install -y postgresql-16 postgresql-contrib-16
     ```

2. **Start and Enable PostgreSQL Service**
   - Start and enable PostgreSQL:
     ```bash
     sudo systemctl start postgresql
     sudo systemctl enable postgresql
     ```

## Step 4: Install Nginx

1. **Install Nginx**
   - Install Nginx web server:
     ```bash
     sudo apt install -y nginx
     ```

## Step 5: Clone Your Repository

1. **Clone the STA-CRM Repository**
   - Create a directory and clone the repository:
     ```bash
     sudo mkdir -p /var/www/stacrm
     sudo chown $USER:$USER /var/www/stacrm
     cd /var/www/stacrm
     git clone https://github.com/zaki-mca/STA-CRM-6.git .
     ```

## Step 6: Install Dependencies and Build the App

1. **Install Frontend Dependencies and Build**
   - Install dependencies and build the frontend:
     ```bash
     pnpm install
     NODE_ENV=production pnpm build
     ```

2. **Install Backend Dependencies and Build**
   - Install server dependencies and build the backend:
     ```bash
     cd server
     pnpm install
     npm run build
     cd ..
     ```

## Step 7: Set Up Environment Variables

1. **Create Environment File for Next.js Frontend**
   - Create a `.env.local` file in your project root:
     ```bash
     cat > /var/www/stacrm/.env.local << EOL
     NEXT_PUBLIC_API_URL=http://64.226.80.247:5000/api
     NEXT_PUBLIC_SITE_URL=http://64.226.80.247
     NODE_ENV=production
     EOL
     ```

2. **Create Environment File for Express.js Backend**
   - Create a `.env` file in the `server` directory:
     ```bash
     cat > /var/www/stacrm/server/.env << EOL
     PORT=5000
     NODE_ENV=production
     DATABASE_URL=postgresql://postgres:postgres@localhost:5432/stacrm
     PGUSER=postgres
     PGHOST=localhost
     PGPASSWORD=postgres
     PGDATABASE=stacrm
     PGPORT=5432
     JWT_SECRET=your_jwt_secret_key
     JWT_EXPIRES_IN=1d
     EOL
     ```

## Step 8: Configure PM2 for Process Management

1. **Create PM2 Configuration File**
   - Create a file named `ecosystem.config.js` in your project root:
     ```bash
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
     ```

2. **Start the Application with PM2**
   - Start the application using PM2:
     ```bash
     cd /var/www/stacrm
     pm2 start ecosystem.config.js
     pm2 save
     pm2 startup
     ```
   - Follow the instructions provided by `pm2 startup` to ensure PM2 starts on boot.

## Step 9: Configure Nginx as Reverse Proxy

1. **Create Nginx Configuration**
   - Create a new Nginx configuration file:
     ```bash
     sudo tee /etc/nginx/sites-available/stacrm << EOL
     server {
       listen 80;
       server_name 64.226.80.247;

       location / {
         proxy_pass http://localhost:3000;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
       }

       location /api {
         proxy_pass http://localhost:5000;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
       }
     }
     EOL
     ```

2. **Enable the Configuration**
   - Enable the configuration and restart Nginx:
     ```bash
     sudo ln -s /etc/nginx/sites-available/stacrm /etc/nginx/sites-enabled/
     sudo nginx -t
     sudo systemctl restart nginx
     ```

## Step 10: Database Setup

1. **Install PostgreSQL**
   - Ensure PostgreSQL is installed and running:
     ```bash
     sudo systemctl start postgresql
     sudo systemctl enable postgresql
     ```

2. **Create Database and User**
   - Access PostgreSQL and create the database and user:
     ```bash
     sudo -i -u postgres
     psql
     CREATE DATABASE stacrm;
     CREATE USER stacrm_user WITH PASSWORD 'strong_password';
     GRANT ALL PRIVILEGES ON DATABASE stacrm TO stacrm_user;
     ALTER USER stacrm_user WITH SUPERUSER;
     \q
     exit
     ```

3. **Import Database Schema**
   - Import your database schema:
     ```bash
     cd /var/www/stacrm/server
     sudo -u postgres psql stacrm < src/db/schema.sql
     ```

4. **Configure PostgreSQL for Local Connections**
   - Edit the `pg_hba.conf` file to allow local connections:
     ```bash
     sudo nano /etc/postgresql/16/main/pg_hba.conf
     ```
   - Add or modify these lines:
     ```
     host    stacrm          stacrm_user     127.0.0.1/32            md5
     host    stacrm          stacrm_user     ::1/128                 md5
     ```

5. **Restart PostgreSQL**
   - Restart PostgreSQL to apply changes:
     ```bash
     sudo systemctl restart postgresql
     ```

## Step 11: Start Services

1. **Verify Services**
   - Check the status of your services:
     ```bash
     pm2 list
     sudo systemctl status nginx
     sudo systemctl status postgresql
     ```

2. **Access Your Application**
   - Visit your application in a web browser at `http://64.226.80.247`. 