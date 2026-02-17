#!/bin/bash

# EC2 Deployment Script for Loyalty Management Application
set -e

echo "🚀 Starting deployment on EC2..."

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    sudo yum install -y docker
    sudo systemctl start docker
    sudo systemctl enable docker
    sudo usermod -a -G docker ec2-user
    echo "✅ Docker installed successfully!"
fi

# Install Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo "✅ Docker Compose installed successfully!"
fi

# Install Git (if not already installed)
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo yum install -y git
fi

# Create application directory
APP_DIR="/home/ec2-user/loyalty-app"
echo "📁 Setting up application directory at $APP_DIR..."

# Clone the repository if directory doesn't exist
if [ ! -d "$APP_DIR" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/GuideXR/asg-loyalty-platform.git $APP_DIR
else
    echo "📥 Updating repository..."
    cd $APP_DIR
    git pull origin main
fi

cd $APP_DIR

# Set proper ownership
sudo chown -R ec2-user:ec2-user $APP_DIR

# Create production environment files
echo "⚙️ Setting up environment variables..."
cat > backend/.env << EOF
DATABASE_URL=sqlite:///./loyalty.db
CORS_ORIGINS=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4),https://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
JWT_SECRET_KEY=$(openssl rand -hex 32)
ENVIRONMENT=production
EOF

cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4):8000
NODE_ENV=production
EOF

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down --remove-orphans 2>/dev/null || true

# Build and start services
echo "🔨 Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 45

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Setup database (run migrations/seeding)
echo "🗄️ Setting up database with sample data..."
docker-compose exec -T backend python seed.py || echo "Database already seeded"

# Setup log rotation
echo "📝 Setting up log rotation..."
sudo tee /etc/logrotate.d/loyalty-app > /dev/null <<EOF
/var/lib/docker/containers/*/*-json.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
EOF

# Setup systemd service for auto-restart
echo "🔄 Setting up systemd service..."
sudo tee /etc/systemd/system/loyalty-app.service > /dev/null <<EOF
[Unit]
Description=Loyalty Management Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0
User=ec2-user
Group=ec2-user

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable loyalty-app.service

# Setup firewall rules (if firewalld is running)
if systemctl is-active --quiet firewalld; then
    echo "🔥 Configuring firewall..."
    sudo firewall-cmd --permanent --add-port=80/tcp
    sudo firewall-cmd --permanent --add-port=3000/tcp
    sudo firewall-cmd --permanent --add-port=8000/tcp
    sudo firewall-cmd --reload
fi

# Get public IP
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Application URLs:"
echo "   Frontend: http://$PUBLIC_IP"
echo "   Admin Dashboard: http://$PUBLIC_IP/admin"
echo "   Backend API: http://$PUBLIC_IP:8000"
echo "   API Documentation: http://$PUBLIC_IP:8000/docs"
echo ""
echo "🔑 Default Admin Login:"
echo "   Email: admin@loyaltyapp.com"
echo "   Password: admin123"
echo ""
echo "⚠️  Important: Change the admin password after first login!"
echo ""
echo "📊 Service Status:"
docker-compose ps
echo ""
echo "🔧 To manage the application:"
echo "   View logs: docker-compose logs -f"
echo "   Restart: docker-compose restart"
echo "   Stop: docker-compose down"
echo "   Update: git pull && docker-compose up -d --build"