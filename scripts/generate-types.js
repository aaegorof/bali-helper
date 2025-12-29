const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to load from .env.local first, then fall back to .env
const envPath = fs.existsSync(path.resolve(__dirname, '..', '.env.local'))
  ? path.resolve(__dirname, '..', '.env.local')
  : path.resolve(__dirname, '..', '.env');

require('dotenv').config({ path: envPath });

// Debug: show which env file is being used
console.log('Using env file at:', envPath);

// Ensure we have the required environment variable
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
  console.error(
    'Please make sure you have created a .env file with SUPABASE_SERVICE_ROLE_KEY=your_key'
  );
  process.exit(1);
}

try {
  // Set up paths
  const projectRoot = path.resolve(__dirname, '..');
  const typesPath = path.join(projectRoot, 'src', 'app', 'types', 'supabase.ts');

  // Execute the Supabase CLI command
  execSync(
    `npx supabase gen types typescript --project-id "gdfomommnisgotgwrufs" > "${typesPath}"`,
    {
      env: {
        ...process.env,
        SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_SERVICE_ROLE_KEY,
      },
      stdio: 'inherit',
    }
  );

  // Format the generated types file
  execSync(`npx prettier --write "${typesPath}"`, {
    stdio: 'inherit',
  });

  console.log('✅ Successfully generated and formatted Supabase types');
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  process.exit(1);
}
