const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAndFixRoles() {
  try {
    console.log('🔍 Checking agents table...');
    
    // Check current agents
    const { data: agents, error: fetchError } = await supabase
      .from('agents')
      .select('id, display_name, email, role, created_at')
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching agents:', fetchError);
      return;
    }

    console.log(`📊 Found ${agents.length} agents:`);
    agents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.display_name} (${agent.email}) - Role: ${agent.role || 'NULL'}`);
    });

    // Check if any agents have NULL role
    const agentsWithoutRole = agents.filter(agent => !agent.role);
    
    if (agentsWithoutRole.length > 0) {
      console.log(`\n⚠️  Found ${agentsWithoutRole.length} agents without role. Setting roles...`);
      
      // Set the first agent (oldest) as OWNER, rest as AGENT
      for (let i = 0; i < agentsWithoutRole.length; i++) {
        const agent = agentsWithoutRole[i];
        const role = i === 0 ? 'OWNER' : 'AGENT';
        
        const { error: updateError } = await supabase
          .from('agents')
          .update({ role })
          .eq('id', agent.id);
          
        if (updateError) {
          console.error(`❌ Error updating ${agent.display_name}:`, updateError);
        } else {
          console.log(`✅ Set ${agent.display_name} role to ${role}`);
        }
      }
    } else {
      console.log('✅ All agents already have roles assigned');
    }

    // Final check
    console.log('\n🔍 Final agent roles:');
    const { data: finalAgents } = await supabase
      .from('agents')
      .select('id, display_name, email, role')
      .order('created_at', { ascending: true });
      
    finalAgents.forEach((agent, index) => {
      console.log(`${index + 1}. ${agent.display_name} - Role: ${agent.role}`);
    });

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkAndFixRoles();
