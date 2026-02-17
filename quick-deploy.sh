#!/bin/bash

# Quick EC2 Deployment Script - One Command Deploy
# Usage: curl -sSL https://raw.githubusercontent.com/GuideXR/asg-loyalty-platform/main/quick-deploy.sh | bash

set -e

echo "🚀 ASG Loyalty Platform - Quick Deploy"
echo "======================================"

# Check if running on EC2
if ! curl -s --max-time 3 http://169.254.169.254/latest/meta-data/instance-id > /dev/null 2>&1; then
    echo "❌ This script must be run on an EC2 instance"
    exit 1
fi

# Get EC2 metadata
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
REGION=$(curl -s http://169.254.169.254/latest/meta-data/placement/region)

echo "📍 Instance: $INSTANCE_ID"
echo "🌐 Public IP: $PUBLIC_IP"
echo "🗺️  Region: $REGION"
echo ""

# Download and run the main deployment script
echo "📥 Downloading deployment script..."
curl -sSL https://raw.githubusercontent.com/GuideXR/asg-loyalty-platform/main/deploy.sh -o deploy.sh
chmod +x deploy.sh

echo "🚀 Starting deployment..."
./deploy.sh

echo ""
echo "🎉 Deployment completed!"
echo "🌐 Your loyalty platform is now available at:"
echo "   http://$PUBLIC_IP"