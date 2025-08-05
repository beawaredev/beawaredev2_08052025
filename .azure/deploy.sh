#!/bin/bash
# Helper script for deploying BeAware.fyi to Azure

echo "=== BeAware.fyi Azure Deployment Script ==="

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI not found. Please install it first: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Login to Azure
echo "🔑 Logging in to Azure..."
az login

# Get subscription list
echo "📋 Available subscriptions:"
az account list --output table

# Ask for subscription selection
read -p "Enter the subscription ID to use: " SUBSCRIPTION_ID
az account set --subscription "$SUBSCRIPTION_ID"
echo "✅ Subscription set to: $SUBSCRIPTION_ID"

# Ask for resource group
read -p "Enter a name for the new resource group: " RESOURCE_GROUP
read -p "Enter location (e.g., eastus, westus, centralus): " LOCATION

# Create resource group
echo "🔨 Creating resource group $RESOURCE_GROUP in $LOCATION..."
az group create --name "$RESOURCE_GROUP" --location "$LOCATION"

# App name
read -p "Enter a base name for your app (max 11 chars, lowercase, no special chars): " APP_NAME

# Collect secrets
read -sp "Enter PostgreSQL admin password: " POSTGRES_PASSWORD
echo
read -sp "Enter Firebase API Key: " FIREBASE_API_KEY
echo
read -p "Enter Firebase Project ID: " FIREBASE_PROJECT_ID
read -sp "Enter Firebase App ID: " FIREBASE_APP_ID
echo
read -sp "Enter email password for sending emails: " EMAIL_PASSWORD
echo

# Deploy template
echo "🚀 Deploying BeAware.fyi resources to Azure..."
TEMPLATE_PATH="$(dirname "$(readlink -f "$0")")/deployment-template.json"

az deployment group create \
  --resource-group "$RESOURCE_GROUP" \
  --template-file "$TEMPLATE_PATH" \
  --parameters \
    appName="$APP_NAME" \
    location="$LOCATION" \
    postgresAdminPassword="$POSTGRES_PASSWORD" \
    firebaseApiKey="$FIREBASE_API_KEY" \
    firebaseProjectId="$FIREBASE_PROJECT_ID" \
    firebaseAppId="$FIREBASE_APP_ID" \
    emailPassword="$EMAIL_PASSWORD"

# Get deployment outputs
echo "📝 Getting deployment details..."
WEB_APP=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name deployment --query properties.outputs.webAppUrl.value -o tsv)
REGISTRY_URL=$(az deployment group show --resource-group "$RESOURCE_GROUP" --name deployment --query properties.outputs.registryUrl.value -o tsv)

echo "✅ Deployment template applied successfully!"
echo
echo "==== Next Steps ===="
echo "1. Build and push your Docker image to: $REGISTRY_URL"
echo "   docker build -t $REGISTRY_URL/beaware:latest ."
echo "   az acr login --name $(echo $REGISTRY_URL | cut -d '.' -f1)"
echo "   docker push $REGISTRY_URL/beaware:latest"
echo
echo "2. Configure your web app to use your container"
echo "   az webapp config container set --resource-group $RESOURCE_GROUP --name ???-app --docker-custom-image-name $REGISTRY_URL/beaware:latest"
echo
echo "3. Initialize the database schema"
echo "   az webapp ssh --resource-group $RESOURCE_GROUP --name ???-app"
echo "   cd site/wwwroot && npm run db:push"
echo
echo "4. Your app will be available at: $WEB_APP"
echo 
echo "Note: Replace '???' with your actual resource names. You can find them in the Azure portal."