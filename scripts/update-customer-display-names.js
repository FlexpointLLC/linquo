const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://vzoteejdvffrdjprfpad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3RlZWpkdmZmcmRqcHJmcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDg2NjMsImV4cCI6MjA3NDAyNDY2M30.OnExGM-A8Wmm-iNVHMjwFsS0iyNZjZuZXrzPR5GqTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCustomerDisplayNames() {
  try {
    console.log('🔍 Fetching customers without display_name...');
    
    // Get all customers
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, email, display_name')
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching customers:', fetchError);
      return;
    }

    console.log(`📊 Found ${customers.length} customers`);

    // Filter customers that need display_name updates
    const customersToUpdate = customers.filter(customer => 
      !customer.display_name || customer.display_name.trim() === ''
    );

    console.log(`🔄 Found ${customersToUpdate.length} customers that need display_name updates`);

    if (customersToUpdate.length === 0) {
      console.log('✅ All customers already have display_name set');
      return;
    }

    // Update each customer
    for (const customer of customersToUpdate) {
      // Extract name from email (part before @)
      const nameFromEmail = customer.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      const displayName = nameFromEmail
        .replace(/[._]/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      console.log(`📝 Updating customer ${customer.email} -> display_name: "${displayName}"`);

      const { error: updateError } = await supabase
        .from('customers')
        .update({ display_name: displayName })
        .eq('id', customer.id);

      if (updateError) {
        console.error(`❌ Error updating customer ${customer.email}:`, updateError);
      } else {
        console.log(`✅ Updated customer ${customer.email}`);
      }
    }

    console.log('🎉 Customer display_name update completed!');

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
updateCustomerDisplayNames();
