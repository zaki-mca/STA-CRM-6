#!/bin/bash
# STA-CRM-6.0 Docker Deployment Script

set -e

echo "==== STA-CRM-6.0 Docker Deployment ===="
echo "This script will deploy the STA-CRM application using Docker"

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "Docker installed. You may need to log out and log back in for group changes to take effect."
    echo "Please run this script again after logging back in."
    exit 0
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    sudo apt install -y docker-compose-plugin
    sudo ln -s /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose
fi

# Clone repository if not present
if [ ! -d "STA-CRM-6.0" ]; then
    echo "Cloning repository..."
    git clone https://github.com/zaki-mca/STA-CRM-6.git STA-CRM-6.0
    cd STA-CRM-6.0
else
    echo "Updating repository..."
    cd STA-CRM-6.0
    git pull
fi

# Check for Docker Compose file
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: docker-compose.yml not found!"
    exit 1
fi

# Create uploads directory if it doesn't exist
mkdir -p server/uploads
chmod 777 server/uploads

# Create .env.docker files from examples if they don't exist
if [ ! -f ".env.docker" ]; then
    echo "Creating .env.docker from template..."
    cp .env.local .env.docker
    sed -i 's|http://localhost:5000/api|http://164.90.177.106/api|g' .env.docker
    sed -i 's|http://localhost:3000|http://164.90.177.106|g' .env.docker
    echo "NODE_ENV=production" >> .env.docker
fi

if [ ! -f "server/.env.docker" ]; then
    echo "Creating server/.env.docker from template..."
    mkdir -p server
    cat > server/.env.docker << EOL
PORT=5000
NODE_ENV=production
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/stacrm
PGUSER=postgres
PGHOST=postgres
PGPASSWORD=postgres
PGDATABASE=stacrm
PGPORT=5432
JWT_SECRET=0182118f76d495a9729c53d51b37199e7407e7a6b1ea1117ca780c3314a28d938927e8548cd7d8a1039106cacad4c115effc7ff4c0bb62d0b074897c4efee1ceb99aa2d031e45ceb3ac48cf4452d95f1dc98cd1906d69a071ed535376aeb1d780a4671e0ba66d3f9d064f5701b866a6b2a0284129ae86f37b50659f59b7c394c5fe0cdcb1d4fbcd0123223b413cd2f88410f01693c58f13007cd24b0ecfb54f829541e7639f6041699e4ea8aa219012b10e07798f3f5537986941121d69825a8dee5fdc3660f25bfb8829a85093959edb5f14ad66dd5c4654e55c03de46d57139b6c4573e353df8f4a5c9c46c98ec41c20b17074fb94d1357994b29e6bb8bcb3
JWT_EXPIRES_IN=1d
EOL
fi

# Stop any running containers
echo "Stopping any running containers..."
sudo docker-compose down

# Build and start containers
echo "Building and starting containers..."
sudo docker-compose build
sudo docker-compose up -d

# Show status
echo "Deployment completed!"
echo "Your application should be accessible at http://164.90.177.106"
echo "Backend API: http://164.90.177.106/api"
echo "App status:"
sudo docker-compose ps

echo "=== Logs ===="
echo "To view logs: sudo docker-compose logs -f" 