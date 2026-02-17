#!/bin/bash
set -e

echo "🔨 Building backend for Render..."

# Install dependencies
pip install -r requirements.txt

# Run database setup
echo "🗄️ Setting up database..."
python seed.py

echo "✅ Backend build completed!"