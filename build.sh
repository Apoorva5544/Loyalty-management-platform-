#!/bin/bash
set -e

echo "🔨 Building ASG Loyalty Platform..."

# Determine if this is backend or frontend based on environment
if [ "$RENDER_SERVICE_NAME" = "asg-loyalty-backend" ]; then
    echo "📦 Building Backend..."
    cd backend
    pip install -r requirements.txt
    echo "✅ Backend build completed!"
elif [ "$RENDER_SERVICE_NAME" = "asg-loyalty-frontend" ]; then
    echo "📦 Building Frontend..."
    cd frontend
    npm install
    npm run build
    echo "✅ Frontend build completed!"
else
    echo "❓ Unknown service, building backend by default..."
    cd backend
    pip install -r requirements.txt
fi