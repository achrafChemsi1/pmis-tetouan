#!/bin/bash

# PMIS Tetouan - Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "====================================="
echo "PMIS Tetouan - Development Setup"
echo "====================================="
echo ""

# Check prerequisites
echo "[1/7] Checking prerequisites..."
command -v docker >/dev/null 2>&1 || { echo "Error: Docker is not installed"; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo "Error: Docker Compose is not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "Error: Node.js is not installed"; exit 1; }
echo "✓ All prerequisites met"

# Clone repository (if not already cloned)
if [ ! -d "pmis-tetouan" ]; then
    echo "[2/7] Cloning repository..."
    git clone https://github.com/achrafChemsi1/pmis-tetouan.git
    cd pmis-tetouan
else
    echo "[2/7] Repository already exists"
    cd pmis-tetouan
fi

# Copy environment files
echo "[3/7] Setting up environment files..."
if [ ! -f "infrastructure/docker/.env" ]; then
    cp infrastructure/docker/.env.example infrastructure/docker/.env
    echo "✓ Created .env file - PLEASE UPDATE WITH YOUR CREDENTIALS"
else
    echo "✓ .env file already exists"
fi

# Start Docker services
echo "[4/7] Starting Docker services..."
cd infrastructure/docker
docker-compose up -d mysql redis minio
echo "✓ Database services started"

# Wait for MySQL to be ready
echo "[5/7] Waiting for MySQL to be ready..."
sleep 10
until docker-compose exec -T mysql mysqladmin ping -h localhost --silent; do
    echo "Waiting for MySQL..."
    sleep 2
done
echo "✓ MySQL is ready"

# Initialize database
echo "[6/7] Initializing database..."
cd ../../
mysql -h 127.0.0.1 -u root -p < database/schema/01-create-database.sql
mysql -h 127.0.0.1 -u pmis_app -p pmis_tetouan < database/schema/02-create-tables.sql
echo "✓ Database initialized"

# Setup complete
echo "[7/7] Setup complete!"
echo ""
echo "====================================="
echo "Next steps:"
echo "1. Update infrastructure/docker/.env with your credentials"
echo "2. Start backend: cd backend && npm install && npm run start:dev"
echo "3. Start frontend: cd frontend && npm install && npm start"
echo "4. Access application at http://localhost:3000"
echo "5. Default admin login: admin / Admin@2025 (CHANGE IMMEDIATELY)"
echo "====================================="
