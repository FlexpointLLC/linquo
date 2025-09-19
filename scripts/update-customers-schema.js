// Script to update customers table schema
// Run with: node scripts/update-customers-schema.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://annmgrgoyyfapxrujwxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubm1ncmdveXlmYXB4cnVqd3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDg5MTEsImV4cCI6MjA2ODc4NDkxMX0.10hHsLUM0lyBmRmhD1vy67kexf7-z46iggxuS5vtvvI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCustomersSchema() {
  try {
    console.log('🔄 Updating customers table schema...');

    // Add website column to customers table
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE customers 
        ADD COLUMN IF NOT EXISTS website TEXT;
      `
    });

    if (error) {
      console.error('Error updating schema:', error);
      return;
    }

    console.log('✅ Customers table schema updated successfully!');
    console.log('Added website column to customers table');

    // Update existing customers with default website
    const { data: updateData, error: updateError } = await supabase
      .from('customers')
      .update({ website: 'example.com' })
      .is('website', null);

    if (updateError) {
      console.error('Error updating existing customers:', updateError);
    } else {
      console.log('✅ Updated existing customers with default website');
    }

  } catch (error) {
    console.error('Error updating customers schema:', error);
  }
}

updateCustomersSchema();
