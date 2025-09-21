const { createClient } = require('@supabase/supabase-js');

// Use the same credentials from .env.local
const supabaseUrl = 'https://vzoteejdvffrdjprfpad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3RlZWpkdmZmcmRqcHJmcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDg2NjMsImV4cCI6MjA3NDAyNDY2M30.OnExGM-A8Wmm-iNVHMjwFsS0iyNZjZuZXrzPR5GqTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixEmailConstraint() {
  console.log('🔧 Adding unique constraint to email column in customers table...');
  
  try {
    // First, let's check the current customers table structure
    const { data: customers, error: fetchError } = await supabase
      .from('customers')
      .select('id, email, created_at')
      .order('created_at', { ascending: true });
    
    if (fetchError) {
      console.error('❌ Error fetching customers:', fetchError);
      return;
    }
    
    console.log(`📊 Found ${customers.length} customers in the table`);
    
    // Check for duplicates
    const emailCounts = {};
    const duplicates = [];
    
    customers.forEach(customer => {
      if (emailCounts[customer.email]) {
        emailCounts[customer.email].push(customer);
        if (emailCounts[customer.email].length === 2) {
          duplicates.push(customer.email);
        }
      } else {
        emailCounts[customer.email] = [customer];
      }
    });
    
    if (duplicates.length > 0) {
      console.log('⚠️ Found duplicate emails:', duplicates);
      console.log('🔧 Removing duplicates (keeping the oldest)...');
      
      for (const email of duplicates) {
        const customersWithEmail = emailCounts[email];
        // Keep the first one (oldest), delete the rest
        const toDelete = customersWithEmail.slice(1);
        
        for (const customer of toDelete) {
          const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .eq('id', customer.id);
          
          if (deleteError) {
            console.error('❌ Error deleting duplicate customer:', deleteError);
          } else {
            console.log(`✅ Deleted duplicate customer ${customer.id} for email ${email}`);
          }
        }
      }
    } else {
      console.log('✅ No duplicate emails found');
    }
    
    // Now try to add the unique constraint using a simple approach
    console.log('🔧 Attempting to add unique constraint...');
    
    // Test if we can insert a duplicate (this should fail if constraint exists)
    const testEmail = 'test-unique-constraint@example.com';
    
    // First, clean up any existing test data
    await supabase.from('customers').delete().eq('email', testEmail);
    
    // Try to insert the same email twice
    const { data: firstInsert, error: firstError } = await supabase
      .from('customers')
      .insert({
        email: testEmail,
        display_name: 'Test User 1',
        org_id: '00000000-0000-0000-0000-000000000000' // Use a dummy org_id
      })
      .select();
    
    if (firstError) {
      console.error('❌ Error with first test insert:', firstError);
      return;
    }
    
    const { data: secondInsert, error: secondError } = await supabase
      .from('customers')
      .insert({
        email: testEmail,
        display_name: 'Test User 2',
        org_id: '00000000-0000-0000-0000-000000000000'
      })
      .select();
    
    if (secondError) {
      console.log('✅ Unique constraint is working! Email constraint exists.');
      // Clean up test data
      await supabase.from('customers').delete().eq('email', testEmail);
    } else {
      console.log('⚠️ No unique constraint found. The constraint needs to be added manually in Supabase dashboard.');
      console.log('📝 Please go to your Supabase dashboard and add a unique constraint on the email column.');
      // Clean up test data
      await supabase.from('customers').delete().eq('email', testEmail);
      if (secondInsert && secondInsert.length > 0) {
        await supabase.from('customers').delete().eq('id', secondInsert[0].id);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixEmailConstraint();
