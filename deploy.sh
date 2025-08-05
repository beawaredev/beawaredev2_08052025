#!/bin/bash

# Exit on any error
set -e

echo "Starting Node.js deployment for Azure App Service"

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "npm is not installed"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"

# Set deployment paths
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-$PWD}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}

echo "Deployment source: $DEPLOYMENT_SOURCE"
echo "Deployment target: $DEPLOYMENT_TARGET"

# Create target directory if it doesn't exist
mkdir -p "$DEPLOYMENT_TARGET"

# Copy files to deployment target
echo "Copying files to deployment target..."
rsync -av --exclude=node_modules --exclude=.git --exclude=.github "$DEPLOYMENT_SOURCE/" "$DEPLOYMENT_TARGET/"

# Navigate to deployment target
cd "$DEPLOYMENT_TARGET"

# Install dependencies
echo "Installing npm dependencies..."
npm ci --only=production

echo "Skipping build step - app already built in GitHub Actions"

echo "Deployment completed successfully"