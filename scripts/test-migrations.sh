#!/bin/bash
# Database migration testing script

set -e

echo "🚀 Starting database migration tests..."

# Test environments
ENVIRONMENTS=("test" "staging")

for ENV in "${ENVIRONMENTS[@]}"; do
    echo "📊 Testing migrations for $ENV environment..."
    
    # Create test database
    DB_NAME="migration_test_$ENV"
    createdb $DB_NAME || true
    
    # Set environment variables
    export NODE_ENV=$ENV
    export DATABASE_URL="postgresql://localhost/$DB_NAME"
    
    # Test forward migrations
    echo "⬆️  Testing forward migrations..."
    npm run migrate:up
    
    # Verify schema
    echo "🔍 Verifying database schema..."
    psql $DATABASE_URL -c "\dt" > schema_$ENV.txt
    
    # Test rollback migrations
    echo "⬇️  Testing rollback migrations..."
    npm run migrate:down
    
    # Test migration from scratch
    echo "🔄 Testing full migration from scratch..."
    npm run migrate:reset
    npm run migrate:up
    
    # Test seed data
    echo "🌱 Testing seed data..."
    npm run seed:run
    
    # Verify data integrity
    echo "✅ Verifying data integrity..."
    npm run test:data-integrity
    
    # Cleanup
    dropdb $DB_NAME
    
    echo "✨ Migration tests completed for $ENV environment"
done

echo "🎉 All migration tests passed!"