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

# Always force clean compilation to ensure fresh artifacts
echo "🧹 Cleaning old compiled files..."
rm -rf compiled/server/* compiled/shared/* 2>/dev/null || true

echo "🔨 Force compiling all TypeScript files..."
npx tsc --project server/tsconfig.json || {
    echo "❌ TypeScript compilation failed!"
    exit 1
}

# Compile shared files separately to ensure they're fresh
echo "🔧 Compiling shared TypeScript files..."
npx tsc shared/*.ts --outDir compiled/shared --target ES2020 --module NodeNext --moduleResolution NodeNext --esModuleInterop --skipLibCheck || {
    echo "❌ Shared files compilation failed!"
    exit 1
}

# Step 5: Copy package.json and other necessary files
echo "📋 Copying configuration files..."
cp package.json compiled/ 2>/dev/null || true
cp package-lock.json compiled/ 2>/dev/null || true
cp server.js . 2>/dev/null || true

# Step 5.5: Ensure Azure gets the right files
echo "🔄 Setting up Azure-specific files..."
# Copy the entry point server.js to root for Azure IIS
if [ -f "compiled/server/index.js" ]; then
    echo "📄 Copying main server file for Azure..."
    cp compiled/server/index.js server.js
fi

# Copy dist to public for Azure static assets (web.config expects public/)
echo "📁 Setting up static assets for Azure..."
rm -rf public 2>/dev/null || true
mkdir -p public
if [ -d "dist" ]; then
    echo "✅ Copying Vite build (dist/) to public/ for Azure..."
    cp -r dist/* public/
else
    echo "⚠️  Vite dist folder not found - static assets may not work"
fi

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