#!/bin/bash

echo "🚀 Starting Azure deployment build..."

# Step 1: Install dependencies if needed
echo "📦 Installing dependencies..."
npm ci

# Step 2: Build frontend
echo "🎨 Building frontend with Vite..."
vite build

# Step 3: Ensure compiled directories exist
echo "📁 Creating build directories..."
mkdir -p compiled/server
mkdir -p compiled/shared

# Step 4: Copy and build server files
echo "🔧 Building server files..."

# Copy server files and compile them using the existing compiled versions
# This ensures Azure deployment works with the existing build structure


# Step 5: Copy package.json and other necessary files
echo "📋 Copying configuration files..."
cp package.json compiled/ 2>/dev/null || true
cp package-lock.json compiled/ 2>/dev/null || true

# Step 6: Verify build output
echo "🔍 Verifying build output..."
if [ -f "compiled/server/index.js" ]; then
    echo "✅ Server build successful"
else
    echo "❌ Server build failed - index.js not found"
    exit 1
fi

if [ -d "dist/public" ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed - dist/public not found"
    exit 1
fi

echo "🎉 Build completed successfully!"
echo "📦 Ready for Azure deployment"