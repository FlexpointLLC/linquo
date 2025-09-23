// Script to update customers table with comprehensive data collection fields
// Run with: node scripts/update-customer-schema-comprehensive.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vzoteejdvffrdjprfpad.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6b3RlZWpkdmZmcmRqcHJmcGFkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0NDg2NjMsImV4cCI6MjA3NDAyNDY2M30.OnExGM-A8Wmm-iNVHMjwFsS0iyNZjZuZXrzPRy5GqTw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCustomerSchema() {
  try {
    console.log('🔄 Updating customers table with comprehensive data collection fields...');

    // Add all the new columns for comprehensive customer data
    const columns = [
      // Device & Browser Information
      'user_agent TEXT',
      'browser_name VARCHAR(50)',
      'browser_version VARCHAR(20)',
      'os_name VARCHAR(50)',
      'os_version VARCHAR(20)',
      'device_type VARCHAR(20)',
      'screen_resolution VARCHAR(20)',
      'timezone VARCHAR(50)',
      
      // Network & Location Information
      'ip_address INET',
      'country VARCHAR(100)',
      'region VARCHAR(100)',
      'city VARCHAR(100)',
      'postal_code VARCHAR(20)',
      'latitude DECIMAL(10, 8)',
      'longitude DECIMAL(11, 8)',
      'timezone_offset VARCHAR(10)',
      
      // Website Context
      'current_url TEXT',
      'page_title VARCHAR(500)',
      'referrer_url TEXT',
      'utm_source VARCHAR(100)',
      'utm_campaign VARCHAR(100)',
      'utm_medium VARCHAR(100)',
      
      // Behavioral Data
      'session_id VARCHAR(255)',
      'session_start TIMESTAMP',
      'is_returning BOOLEAN DEFAULT FALSE',
      'total_visits INTEGER DEFAULT 1',
      'last_visit TIMESTAMP',
      'avg_session_duration INTEGER',
      
      // Technical Information
      'connection_type VARCHAR(50)',
      'network_speed VARCHAR(50)',
      'page_load_time DECIMAL(5, 2)',
      
      // Privacy & Consent
      'gdpr_consent BOOLEAN DEFAULT FALSE',
      'cookie_consent BOOLEAN DEFAULT FALSE',
      'privacy_policy_accepted BOOLEAN DEFAULT FALSE',
      
      // Additional metadata
      'device_fingerprint VARCHAR(255)',
      'language VARCHAR(10)',
      'color_depth INTEGER',
      'pixel_ratio DECIMAL(3, 2)'
    ];

    // Add each column
    for (const column of columns) {
      const { error } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE customers ADD COLUMN IF NOT EXISTS ${column};`
      });

      if (error) {
        console.error(`Error adding column ${column}:`, error);
      } else {
        console.log(`✅ Added column: ${column}`);
      }
    }

    console.log('✅ Customer table schema updated successfully!');
    console.log('📊 Added comprehensive data collection fields:');
    console.log('   - Device & Browser Information');
    console.log('   - Network & Location Data');
    console.log('   - Website Context');
    console.log('   - Behavioral Analytics');
    console.log('   - Technical Information');
    console.log('   - Privacy & Consent');

  } catch (error) {
    console.error('Error updating customer schema:', error);
  }
}

updateCustomerSchema();
