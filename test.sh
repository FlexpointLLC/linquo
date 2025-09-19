#!/bin/bash

# Simple test script to verify the application is working
echo "🚀 Testing linquo Real-Time Customer Support App"
echo "================================================"

# Start the server in background
echo "📡 Starting server..."
node server/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Test health endpoint
echo "🏥 Testing server health..."
HEALTH_RESPONSE=$(curl -s http://localhost:3001/api/health)
if [[ $HEALTH_RESPONSE == *"OK"* ]]; then
    echo "✅ Server is healthy"
else
    echo "❌ Server health check failed"
    kill $SERVER_PID
    exit 1
fi

# Test agent registration
echo "👤 Testing agent registration..."
REGISTER_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Agent","email":"test@example.com","password":"testpass"}' \
  http://localhost:3001/api/auth/register)

if [[ $REGISTER_RESPONSE == *"token"* ]]; then
    echo "✅ Agent registration successful"
else
    echo "❌ Agent registration failed"
    kill $SERVER_PID
    exit 1
fi

# Test agent login
echo "🔐 Testing agent login..."
LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass"}' \
  http://localhost:3001/api/auth/login)

if [[ $LOGIN_RESPONSE == *"token"* ]]; then
    echo "✅ Agent login successful"
else
    echo "❌ Agent login failed"
    kill $SERVER_PID
    exit 1
fi

# Test session creation
echo "💬 Testing session creation..."
SESSION_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test_session_123","customerName":"Test Customer"}' \
  http://localhost:3001/api/chat/sessions)

if [[ $SESSION_RESPONSE == *"success"* ]]; then
    echo "✅ Session creation successful"
else
    echo "❌ Session creation failed"
    kill $SERVER_PID
    exit 1
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $SERVER_PID
rm -f database/support.db

echo ""
echo "🎉 All tests passed! The linquo app is working correctly."
echo "📝 To start the app:"
echo "   npm run dev (for development)"
echo "   npm start (for production)"