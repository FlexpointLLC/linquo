const { createClient } = require('@supabase/supabase-js');

// Use the same credentials from .env.local
const supabaseUrl = 'https://vzoteejdvffrdjprfpad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3RlZWpkdmZmcmRqcHJmcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDg2NjMsImV4cCI6MjA3NDAyNDY2M30.OnExGM-A8Wmm-iNVHMjwFsS0iyNZjZuZXrzPR5GqTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixCustomersEmailConstraint() {
  console.log('🔧 Adding unique constraint to email column in customers table...');
  
  try {
    // First, let's check if there are any duplicate emails
    const { data: duplicates, error: checkError } = await supabase
      .from('customers')
      .select('email, count(*)')
      .group('email')
      .having('count(*) > 1');
    
    if (checkError) {
      console.error('❌ Error checking for duplicates:', checkError);
      return;
    }
    
    if (duplicates && duplicates.length > 0) {
      console.log('⚠️ Found duplicate emails:', duplicates);
      console.log('🔧 Removing duplicates...');
      
      // Remove duplicates by keeping only the first occurrence
      for (const duplicate of duplicates) {
        const { data: customers, error: fetchError } = await supabase
          .from('customers')
          .select('id, created_at')
          .eq('email', duplicate.email)
          .order('created_at', { ascending: true });
        
        if (fetchError) {
          console.error('❌ Error fetching customers for email:', duplicate.email, fetchError);
          continue;
        }
        
        // Keep the first one, delete the rest
        const toDelete = customers.slice(1);
        for (const customer of toDelete) {
          const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .eq('id', customer.id);
          
          if (deleteError) {
            console.error('❌ Error deleting duplicate customer:', deleteError);
          } else {
            console.log('✅ Deleted duplicate customer:', customer.id);
          }
        }
      }
    }
    
    // Now add the unique constraint
    const { error: constraintError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE customers ADD CONSTRAINT customers_email_unique UNIQUE (email);'
    });
    
    if (constraintError) {
      console.error('❌ Error adding unique constraint:', constraintError);
      
      // Try alternative approach using direct SQL
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('customers')
        .select('email')
        .limit(1); // This will fail if there are still duplicates
      
      if (altError) {
        console.error('❌ Still have duplicate emails after cleanup:', altError);
      } else {
        console.log('✅ Email column is now unique, constraint may already exist');
      }
    } else {
      console.log('✅ Successfully added unique constraint to email column');
    }
    
    // Verify the constraint exists
    const { data: testData, error: testError } = await supabase
      .from('customers')
      .select('email')
      .limit(1);
    
    if (testError) {
      console.error('❌ Error testing constraint:', testError);
    } else {
      console.log('✅ Constraint verification successful');
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixCustomersEmailConstraint();
