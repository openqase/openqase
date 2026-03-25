/**
 * This script enables development mode by creating or updating the .env.local file
 * to bypass authentication for admin routes when running locally.
 */

const fs = require('fs');
const path = require('path');

// Path to .env.local file
const envPath = path.join(process.cwd(), '.env.local');

// Check if .env.local exists
if (fs.existsSync(envPath)) {
  console.log('Updating existing .env.local file...');
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if DEV_MODE_AUTH_BYPASS is already set
  if (envContent.includes('DEV_MODE_AUTH_BYPASS=')) {
    // Update the value
    envContent = envContent.replace(
      /DEV_MODE_AUTH_BYPASS=.*/,
      'DEV_MODE_AUTH_BYPASS=true'
    );
  } else {
    // Add the variable
    envContent += '\n# Development Mode - Set to true to bypass authentication on localhost\nDEV_MODE_AUTH_BYPASS=true\n';
  }
  
  // Write the updated content
  fs.writeFileSync(envPath, envContent);
} else {
  console.log('Creating new .env.local file...');
  
  // Create minimal .env.local file
  const envContent = `# Development Mode - Set to true to bypass authentication on localhost
DEV_MODE_AUTH_BYPASS=true

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Admin configuration
SUPABASE_AUTH_ADMIN_USER=your-admin-email@example.com
`;
  
  fs.writeFileSync(envPath, envContent);
}

console.log('✅ Development mode enabled!');
console.log('You can now access admin routes without authentication when running locally.');
console.log('To apply changes, restart your development server.');