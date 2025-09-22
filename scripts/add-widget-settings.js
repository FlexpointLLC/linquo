const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addWidgetSettings() {
  try {
    console.log('🚀 Adding widget settings to organizations table...');
    
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-widget-settings.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Error executing SQL:', error);
      return;
    }
    
    console.log('✅ Successfully added widget settings columns to organizations table!');
    console.log('📋 Added columns:');
    console.log('   - widget_text_line1 (default: "Hello there")');
    console.log('   - widget_text_line2 (default: "How can we help?")');
    console.log('   - widget_icon_alignment (default: "center")');
    console.log('   - widget_show_branding (default: true)');
    console.log('   - widget_open_on_load (default: false)');
    
    // Verify the columns were added
    const { data: columns, error: columnsError } = await supabase
      .from('organizations')
      .select('widget_text_line1, widget_text_line2, widget_icon_alignment, widget_show_branding, widget_open_on_load')
      .limit(1);
    
    if (columnsError) {
      console.error('❌ Error verifying columns:', columnsError);
    } else {
      console.log('✅ Verification successful - columns are accessible');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

addWidgetSettings();
