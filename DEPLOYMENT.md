# STA-CRM-6.0 Docker Deployment Guide

This document explains how to deploy the STA-CRM-6.0 application using Docker on an Ubuntu 24.04 VPS.

## Prerequisites

- Ubuntu 24.04 LTS VPS
- SSH access to the VPS
- Git installed on the VPS
- Docker and Docker Compose installed (the deployment script will install them if missing)

## Deployment Steps

### 1. Connect to Your VPS

Connect to your VPS using SSH:

```bash
ssh root@164.90.177.106
```

### 2. Install Git if Not Already Installed

```bash
apt update
apt install -y git
```

### 3. Clone the Repository

```bash
git clone https://github.com/zaki-mca/STA-CRM-6.git
cd STA-CRM-6
```

### 4. Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

The deployment script will:
- Install Docker and Docker Compose if not already installed
- Pull the latest code from the repository
- Create required directories and configuration files
- Build and start the Docker containers

### 5. Accessing Your Application

After successful deployment, you can access:
- Frontend: http://164.90.177.106
- Backend API: http://164.90.177.106/api
- Health check: http://164.90.177.106/api/health

## Manual Deployment

If you prefer to deploy manually without using the script:

1. Install Docker and Docker Compose:
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install -y docker-compose-plugin
```

2. Clone the repository:
```bash
git clone https://github.com/zaki-mca/STA-CRM-6.git
cd STA-CRM-6
```

3. Create required directories:
```bash
mkdir -p server/uploads
chmod 777 server/uploads
```

4. Build and run containers:
```bash
sudo docker-compose build
sudo docker-compose up -d
```

## Troubleshooting

### Viewing Logs
```bash
# View all logs
sudo docker-compose logs

# View logs for a specific service
sudo docker-compose logs frontend
sudo docker-compose logs backend
sudo docker-compose logs postgres
```

### Container Management
```bash
# Check container status
sudo docker-compose ps

# Restart containers
sudo docker-compose restart

# Stop and remove containers
sudo docker-compose down
```

### Database Access
```bash
# Connect to PostgreSQL in the container
sudo docker-compose exec postgres psql -U postgres -d stacrm
```

### Common Issues

1. **Permission Denied Errors**:
   Make sure the uploads directory has proper permissions:
   ```bash
   sudo chmod -R 777 server/uploads
   ```

2. **Container Not Starting**:
   Check the logs to identify the problem:
   ```bash
   sudo docker-compose logs backend
   ```

3. **Frontend Cannot Connect to Backend**:
   Make sure the environment variables in `.env.docker` have the correct API URL. 