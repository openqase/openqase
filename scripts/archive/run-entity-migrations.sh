#!/bin/bash

# Entity Relationship System Migration Script
# This script helps run the necessary migrations for the quantum entity system

set -e  # Exit on error

echo "=========================================="
echo "Entity Relationship System Migration Tool"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running against production
read -p "Are you running this against PRODUCTION? (yes/no): " IS_PRODUCTION

if [ "$IS_PRODUCTION" = "yes" ]; then
    echo -e "${RED}⚠️  PRODUCTION MODE - PLEASE ENSURE YOU HAVE A BACKUP!${NC}"
    read -p "Have you backed up the production database? (yes/no): " HAS_BACKUP
    
    if [ "$HAS_BACKUP" != "yes" ]; then
        echo -e "${RED}Please backup the database first!${NC}"
        echo "Run: pg_dump [connection_string] > backup_$(date +%Y%m%d_%H%M%S).sql"
        exit 1
    fi
    
    echo -e "${YELLOW}Using production connection string from environment${NC}"
    CONNECTION_STRING=$PRODUCTION_DATABASE_URL
else
    echo -e "${GREEN}Running against LOCAL Supabase${NC}"
    CONNECTION_STRING="postgresql://postgres:postgres@localhost:54322/postgres"
fi

echo ""
echo "Migration files to run:"
echo "1. create-content-types-migration.sql - Creates new tables"
echo "2. migrate-tags-to-content.sql - Migrates data from legacy fields"
echo "3. cleanup-legacy-fields-migration.sql - Removes old fields (OPTIONAL)"
echo ""

# Function to run a migration
run_migration() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: $file not found!${NC}"
        return 1
    fi
    
    echo -e "${YELLOW}Running: $description${NC}"
    echo "File: $file"
    
    if [ "$IS_PRODUCTION" = "yes" ]; then
        read -p "Proceed with this migration? (yes/no): " PROCEED
        if [ "$PROCEED" != "yes" ]; then
            echo "Skipping migration"
            return 0
        fi
    fi
    
    # Run the migration
    psql "$CONNECTION_STRING" < "$file"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ $description completed successfully${NC}"
    else
        echo -e "${RED}✗ $description failed${NC}"
        return 1
    fi
    
    echo ""
}

# Step 1: Create tables
run_migration "create-content-types-migration.sql" "Creating entity tables and relationships"

# Verify tables were created
echo "Verifying table creation..."
psql "$CONNECTION_STRING" -c "
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('quantum_software', 'quantum_hardware', 'quantum_companies', 'partner_companies')
ORDER BY table_name;
"

read -p "Continue with data migration? (yes/no): " CONTINUE_MIGRATION
if [ "$CONTINUE_MIGRATION" != "yes" ]; then
    echo "Stopping after table creation"
    exit 0
fi

# Step 2: Migrate data
run_migration "migrate-tags-to-content.sql" "Migrating data from legacy fields"

# Verify data migration
echo "Verifying data migration..."
psql "$CONNECTION_STRING" -c "
SELECT 'quantum_software' as entity_type, COUNT(*) as count 
FROM quantum_software
UNION ALL
SELECT 'quantum_hardware', COUNT(*) 
FROM quantum_hardware
UNION ALL
SELECT 'quantum_companies', COUNT(*) 
FROM quantum_companies
UNION ALL
SELECT 'partner_companies', COUNT(*) 
FROM partner_companies
UNION ALL
SELECT 'software_relations', COUNT(*) 
FROM case_study_quantum_software_relations
UNION ALL
SELECT 'hardware_relations', COUNT(*) 
FROM case_study_quantum_hardware_relations
UNION ALL
SELECT 'company_relations', COUNT(*) 
FROM case_study_quantum_company_relations
UNION ALL
SELECT 'partner_relations', COUNT(*) 
FROM case_study_partner_company_relations
ORDER BY entity_type;
"

echo ""
echo -e "${GREEN}=========================================="
echo "Migration Status: COMPLETE"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy the application code with entity relationship support"
echo "2. Test the following:"
echo "   - View a case study page (entities should be clickable)"
echo "   - Edit a case study in admin (entity dropdowns should work)"
echo "   - Save changes (relationships should persist)"
echo ""
echo -e "${YELLOW}⚠️  DO NOT run cleanup-legacy-fields-migration.sql yet!${NC}"
echo "Wait 1-2 weeks to ensure everything works correctly first."
echo ""

if [ "$IS_PRODUCTION" = "yes" ]; then
    echo -e "${RED}IMPORTANT: Monitor production for any issues!${NC}"
    echo "The system maintains backward compatibility with legacy fields."
    echo "If any issues occur, the application will fall back to old behavior."
fi

echo ""
echo "To run cleanup later (after verification):"
echo "psql \$CONNECTION_STRING < cleanup-legacy-fields-migration.sql"