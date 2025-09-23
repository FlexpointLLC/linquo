const { createClient } = require('@supabase/supabase-js');
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

async function updateWidgetDefaults() {
  try {
    console.log('🚀 Updating widget default values for all organizations...');
    
    // Update all organizations to have the new default widget text
    const { data, error } = await supabase
      .from('organizations')
      .update({
        widget_text_line1: 'Hello there',
        widget_text_line2: 'How can we help?'
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all organizations
    
    if (error) {
      console.error('❌ Error updating organizations:', error);
      return;
    }
    
    console.log('✅ Successfully updated widget default values!');
    console.log('📋 Updated values:');
    console.log('   - widget_text_line1: "Hello there"');
    console.log('   - widget_text_line2: "How can we help?"');
    
    // Verify the update
    const { data: orgs, error: verifyError } = await supabase
      .from('organizations')
      .select('id, name, widget_text_line1, widget_text_line2')
      .limit(5);
    
    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
    } else {
      console.log('✅ Verification successful - updated organizations:');
      orgs.forEach(org => {
        console.log(`   - ${org.name}: "${org.widget_text_line1}" | "${org.widget_text_line2}"`);
      });
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

updateWidgetDefaults();
