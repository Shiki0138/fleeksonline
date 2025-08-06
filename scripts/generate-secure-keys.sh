#!/bin/bash

# FLEEKS Security Key Generator
# This script generates secure keys for the Fleeks platform

echo "🔐 FLEEKS Security Key Generator"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to generate and display a key
generate_key() {
    local key_name=$1
    local command=$2
    local key_value=$(eval $command)
    
    echo -e "${GREEN}${key_name}:${NC}"
    echo "${key_value}"
    echo ""
}

echo -e "${YELLOW}⚠️  IMPORTANT: Save these keys securely!${NC}"
echo -e "${YELLOW}Never commit these to version control.${NC}"
echo ""

echo "Generating secure keys..."
echo ""

# Generate NEXTAUTH_SECRET
generate_key "NEXTAUTH_SECRET" "openssl rand -base64 32"

# Generate ENCRYPTION_KEY
generate_key "ENCRYPTION_KEY" "openssl rand -hex 32"

# Generate JWT_SECRET
generate_key "JWT_SECRET" "openssl rand -base64 64"

# Generate a strong database password
generate_key "DATABASE_PASSWORD (for Supabase)" "openssl rand -base64 24 | tr -d '=+/'"

echo -e "${GREEN}✅ Keys generated successfully!${NC}"
echo ""

echo "Next steps:"
echo "1. Copy these keys to your .env.local file"
echo "2. Add them to Vercel environment variables"
echo "3. Store them in a secure password manager"
echo ""

echo -e "${RED}⚠️  WARNING: This is the only time you'll see these keys!${NC}"
echo -e "${RED}Make sure to save them before closing this terminal.${NC}"