#!/bin/bash
set -e

echo "🔨 Building frontend for Render..."

# Install dependencies
npm install

# Build the application
npm run build

echo "✅ Frontend build completed!"