#!/bin/bash

# JobFlow Development Setup Script
echo "🚀 JobFlow Development Setup"

# Kill any existing processes on port 3000
echo "🛑 Killing existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || echo "No processes found on port 3000"

# Wait a moment for processes to fully terminate
sleep 3

# Clear Next.js cache
echo "🧹 Clearing Next.js cache..."
rm -rf .next 2>/dev/null || echo "No .next directory found"

# Start development server with better error handling
echo "🚀 Starting development server..."
npm run dev
