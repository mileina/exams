#!/bin/bash
# Setup Environment Variables Script
# This script helps generate and configure .env files for different environments

set -e

echo "=========================================="
echo "  Environment Setup Script"
echo "=========================================="
echo ""

# Function to generate secrets
generate_secret() {
    local length=${1:-32}
    node -e "console.log(require('crypto').randomBytes($length).toString('hex'))"
}

# Menu
echo "Select environment to setup:"
echo "1) Development (localhost)"
echo "2) Preproduction (staging)"
echo "3) Production"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo "Setting up Development environment..."
        ENV_NAME="development"
        BACKEND_ENV_FILE="backend/.env"
        FRONTEND_ENV_FILE="frontend/.env"
        ;;
    2)
        echo "Setting up Preproduction environment..."
        ENV_NAME="preproduction"
        BACKEND_ENV_FILE="env-configs/.env.preprod.backend"
        FRONTEND_ENV_FILE="env-configs/.env.preprod.frontend"
        ;;
    3)
        echo "Setting up Production environment..."
        ENV_NAME="production"
        BACKEND_ENV_FILE="env-configs/.env.prod.backend"
        FRONTEND_ENV_FILE="env-configs/.env.prod.frontend"
        echo ""
        echo "⚠️  PRODUCTION SETUP - CRITICAL VALUES REQUIRED"
        echo ""
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "Generating secrets..."

# Generate JWT Secret
JWT_SECRET=$(generate_secret 32)
echo "✓ JWT Secret generated"

# Generate API Key
API_KEY=$(generate_secret 32)
echo "✓ API Key generated"

# For production, also generate MongoDB credentials
if [ "$ENV_NAME" = "production" ]; then
    MONGO_PASSWORD=$(generate_secret 16)
    echo "✓ MongoDB password generated"
fi

echo ""
echo "=========================================="
echo "  Generated Secrets"
echo "=========================================="
echo ""
echo "JWT_SECRET:"
echo "$JWT_SECRET"
echo ""
echo "API_KEY:"
echo "$API_KEY"
echo ""

if [ "$ENV_NAME" = "production" ]; then
    echo "MONGO_PASSWORD:"
    echo "$MONGO_PASSWORD"
    echo ""
    echo "⚠️  SAVE THESE VALUES SECURELY!"
    echo ""
fi

echo "=========================================="
echo ""

# Ask for domain (if production)
if [ "$ENV_NAME" = "production" ]; then
    read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
    read -p "Enter MongoDB root user: " MONGO_USER
    read -p "Enter your email for notifications: " EMAIL_USER
    read -p "Enter your email password/app-password: " EMAIL_PASSWORD
fi

echo ""
echo "Files to be updated:"
echo "- $BACKEND_ENV_FILE"
echo "- $FRONTEND_ENV_FILE"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled"
    exit 0
fi

echo ""
echo "Updating files..."

# Note: This is just a guide. In production, manually edit the .env files
# because we shouldn't create .env files with real secrets in scripts

if [ "$ENV_NAME" = "production" ]; then
    echo ""
    echo "📝 Please manually update these files with the values above:"
    echo "   - $BACKEND_ENV_FILE"
    echo "   - $FRONTEND_ENV_FILE"
    echo ""
    echo "Critical values to update:"
    echo "   - Replace 'yourdomain.com' with: $DOMAIN"
    echo "   - Replace 'prod_root_user_change_me' with: $MONGO_USER"
    echo "   - Replace password placeholders with generated secrets"
    echo "   - Update email credentials"
else
    # For development/preproduction, we can auto-create
    cat > "$BACKEND_ENV_FILE" << EOF
# $ENV_NAME Environment Variables
PORT=5000
NODE_ENV=$ENV_NAME
JWT_SECRET=$JWT_SECRET
API_KEY=$API_KEY
MONGO_URI=mongodb://localhost:27017/app_db
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=debug
DEBUG=app:*
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_APPLICATION_PASSWORD=your_app_password
EOF
    echo "✓ Backend .env updated"

    cat > "$FRONTEND_ENV_FILE" << EOF
# $ENV_NAME Environment Variables
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=$ENV_NAME
REACT_APP_ENABLE_DEBUG=true
EOF
    echo "✓ Frontend .env updated"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review the .env files"
echo "2. Update any placeholders with actual values"
echo "3. Set correct file permissions: chmod 600 .env"
echo "4. Do NOT commit .env files (only .env.example)"
echo ""
