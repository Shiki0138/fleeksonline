#!/bin/bash

echo "==================================="
echo "Applying Authentication System Fix"
echo "==================================="

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Error: Supabase CLI is not installed"
    echo "Please install it with: brew install supabase/tap/supabase"
    exit 1
fi

# Apply the migration
echo "Applying migration to fix authentication system..."
supabase db push

echo ""
echo "Migration completed!"
echo ""
echo "Next steps:"
echo "1. Restart your development server"
echo "2. Test login with your existing users"
echo "3. New users will automatically have fleeks_profiles created"
echo ""
echo "The system now uses:"
echo "- auth.users (Supabase Auth) as the primary user table"
echo "- fleeks_profiles references auth.users.id"
echo "- All RLS policies use auth.uid()"
echo "- Single login page at /login"