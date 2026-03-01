#!/bin/bash

# OpenQase Local Development Setup Script
# This script helps set up your local development environment

set -e

echo "🚀 Setting up OpenQase local development environment..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   https://supabase.com/docs/guides/local-development"
    exit 1
fi

# Start Supabase
echo "📦 Starting Supabase local instance..."
supabase start

# Ask user about data setup
echo ""
echo "📊 Data Setup Options:"
echo "1. Use example data (recommended for contributors)"
echo "2. Use production data (requires private-data/production-seed.sql)"
echo "3. Skip data setup (empty database)"
echo ""

read -p "Choose an option (1-3): " choice

case $choice in
    1)
        echo "✅ Using example data from supabase/seed.sql"
        echo "   This will be automatically loaded by Supabase CLI"
        ;;
    2)
        if [ -f "private-data/production-seed.sql" ]; then
            echo "✅ Using production data from private-data/production-seed.sql"
            echo "   Copying to supabase/seed.sql..."
            cp private-data/production-seed.sql supabase/seed.sql
        else
            echo "❌ Production data file not found: private-data/production-seed.sql"
            echo "   Falling back to example data..."
        fi
        ;;
    3)
        echo "✅ Skipping data setup - empty database"
        echo "   Removing seed file..."
        rm -f supabase/seed.sql
        ;;
    *)
        echo "❌ Invalid choice. Using example data..."
        ;;
esac

# Reset database to apply migrations and seed data
echo ""
echo "🔄 Resetting database to apply migrations and seed data..."
supabase db reset

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Your local OpenQase instance is running at:"
echo "   - App: http://localhost:3000"
echo "   - Supabase Dashboard: http://localhost:54323"
echo ""
echo "📚 Next steps:"
echo "   1. Run 'npm run dev' to start the development server"
echo "   2. Visit http://localhost:3000 to see your app"
echo "   3. Use the Supabase Dashboard to manage your local database"
echo ""
echo "🔧 Useful commands:"
echo "   - supabase db reset    # Reset database with fresh data"
echo "   - supabase db diff     # See differences from production"
echo "   - supabase status      # Check local instance status" 