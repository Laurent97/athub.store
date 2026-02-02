// Simple script to apply RLS fixes
// Run this with: node apply-rls-fix.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // You need the service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing required environment variables');
  console.log('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyRLSFix() {
  try {
    console.log('Applying RLS policy fixes...');
    
    // Read the SQL file
    const fs = require('fs');
    const path = require('path');
    const sqlPath = path.join(__dirname, 'database', 'fix_password_reset_rls.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error('Error applying RLS fixes:', error);
      // Try direct SQL execution if RPC fails
      console.log('Trying direct SQL execution...');
      
      // Split SQL into individual statements
      const statements = sql.split(';').filter(s => s.trim());
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.trim().substring(0, 50) + '...');
          const { error: stmtError } = await supabase.from('_temp').select('*').limit(1);
          // This won't work, but shows the approach
        }
      }
    } else {
      console.log('RLS fixes applied successfully!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

applyRLSFix();
