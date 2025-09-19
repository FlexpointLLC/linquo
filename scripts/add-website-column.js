// Script to add website column to customers table
// Run with: node scripts/add-website-column.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://annmgrgoyyfapxrujwxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubm1ncmdveXlmYXB4cnVqd3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDg5MTEsImV4cCI6MjA2ODc4NDkxMX0.10hHsLUM0lyBmRmhD1vy67kexf7-z46iggxuS5vtvvI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addWebsiteColumn() {
  try {
    console.log('🔄 Adding website column to customers table...');

    // First, let's check the current structure
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .limit(1);

    if (fetchError) {
      console.error('Error fetching customers:', fetchError);
      return;
    }

    console.log('Current customers structure:', customers);

    // Try to insert a test customer with website field
    const { data: testCustomer, error: insertError } = await supabase
      .from('customers')
      .insert({
        name: 'Test Customer',
        email: 'test@example.com',
        status: 'active',
        website: 'example.com'
      })
      .select();

    if (insertError) {
      console.error('Error inserting test customer (website column might not exist):', insertError);
      console.log('Please add the website column manually in Supabase dashboard:');
      console.log('ALTER TABLE customers ADD COLUMN website TEXT;');
    } else {
      console.log('✅ Website column exists! Test customer created:', testCustomer);
      
      // Clean up test customer
      await supabase
        .from('customers')
        .delete()
        .eq('email', 'test@example.com');
      console.log('✅ Test customer cleaned up');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

addWebsiteColumn();
