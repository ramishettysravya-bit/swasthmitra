#!/bin/bash

# Start backend in background
echo "Starting Backend..."
cd backend
npm install
npm start &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 5

# Start frontend
echo "Starting Frontend..."
cd ../health-companion-ai-main
npm install
npm run dev

# Cleanup background process on exit
kill $BACKEND_PID
