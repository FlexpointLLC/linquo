#!/bin/bash

echo "🚀 Starting linquo - Real-Time Customer Support App"
echo "=================================================="

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please edit .env file with your configuration before running in production"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d node_modules ]; then
    echo "📦 Installing dependencies..."
    npm run install-deps
fi

# Build frontend for production
echo "🏗️  Building frontend..."
cd client && npm run build
cd ..

# Start the server
echo "🌟 Starting production server on port 3001..."
echo "📱 Customer chat: http://localhost:3001/chat"
echo "👤 Agent login: http://localhost:3001/agent/login"
echo "🏠 Home page: http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm start