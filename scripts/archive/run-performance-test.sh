#!/bin/bash

# Performance Testing Script for OpenQase
# Run this to diagnose admin timeouts and slow page loads

echo "🔍 OpenQase Performance Diagnostic Tool"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}1. Testing build performance...${NC}"
time npm run build

echo ""
echo -e "${YELLOW}2. Starting development server for testing...${NC}"
npm run dev &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 10

echo ""
echo -e "${YELLOW}3. Testing page load times...${NC}"

# Test static pages
echo "Testing Case Study page..."
time curl -s -o /dev/null http://localhost:3000/case-study/quantum-annealing-d-wave

echo "Testing Algorithm page..."
time curl -s -o /dev/null http://localhost:3000/paths/algorithm/quantum-phase-estimation

echo "Testing Persona page..."
time curl -s -o /dev/null http://localhost:3000/paths/persona/quantum-software-developer

echo "Testing Industry page..."
time curl -s -o /dev/null http://localhost:3000/paths/industry/finance

echo ""
echo -e "${YELLOW}4. Testing admin pages (if accessible)...${NC}"
echo "Admin page test (may require authentication):"
time curl -s -o /dev/null http://localhost:3000/admin

echo ""
echo -e "${YELLOW}5. Checking for client-side performance issues...${NC}"
echo "Open your browser to http://localhost:3000 and check the console for:"
echo "  - 🔍 [PERF] Server-side timing logs"
echo "  - 🌐 [PERF] Client-side performance metrics" 
echo "  - Any API calls or database queries happening at runtime"
echo "  - Large JavaScript bundles or slow resources"

echo ""
echo -e "${GREEN}6. Instructions for next steps:${NC}"
echo "  1. Open browser developer tools (F12)"
echo "  2. Go to Network tab"
echo "  3. Visit a case study or algorithm page"
echo "  4. Look for:"
echo "     - Any '/api/' calls (should be ZERO for static pages)"
echo "     - Supabase requests (should be ZERO for static pages)"
echo "     - Large JavaScript files"
echo "     - Slow loading resources"
echo "  5. Check console for detailed timing logs"

echo ""
echo -e "${YELLOW}Waiting 30 seconds for you to test manually...${NC}"
echo "Press Ctrl+C when done testing"

# Wait for manual testing
sleep 30

# Clean up
echo ""
echo "Stopping development server..."
kill $SERVER_PID

echo ""
echo -e "${GREEN}Performance test complete!${NC}"
echo ""
echo "Look for these issues in the logs:"
echo "  ❌ Admin save operations taking >5 seconds"
echo "  ❌ Page renders taking >1 second" 
echo "  ❌ Database queries during page load (should be ZERO)"
echo "  ❌ Large content processing times"
echo "  ❌ Memory usage spikes"
echo ""
echo "Check the server console output above for detailed timing breakdowns."