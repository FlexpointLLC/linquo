// Script to add sample messages to Supabase
// Run with: node scripts/seed-messages.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://annmgrgoyyfapxrujwxe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFubm1ncmdveXlmYXB4cnVqd3hlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyMDg5MTEsImV4cCI6MjA2ODc4NDkxMX0.10hHsLUM0lyBmRmhD1vy67kexf7-z46iggxuS5vtvvI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedMessages() {
  try {
    console.log('🌱 Seeding messages...');

    // First, let's check what conversations exist
    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('id, title');

    if (convError) {
      console.error('Error fetching conversations:', convError);
      return;
    }

    console.log('Found conversations:', conversations);

    if (!conversations || conversations.length === 0) {
      console.log('No conversations found. Creating sample conversations first...');
      
      // Create sample conversations
      const { data: newConversations, error: createError } = await supabase
        .from('conversations')
        .insert([
          { title: 'Acme Inc.', last_message_at: new Date().toISOString() },
          { title: 'John Doe', last_message_at: new Date().toISOString() }
        ])
        .select();

      if (createError) {
        console.error('Error creating conversations:', createError);
        return;
      }

      console.log('Created conversations:', newConversations);
      conversations = newConversations;
    }

    // Add sample messages for each conversation
    for (const conv of conversations) {
      console.log(`Adding messages for conversation: ${conv.title} (${conv.id})`);

      const messages = [
        {
          conversation_id: conv.id,
          author: 'customer',
          name: 'Customer',
          text: 'Hello! I need help with my order.',
          created_at: new Date(Date.now() - 60000).toISOString() // 1 minute ago
        },
        {
          conversation_id: conv.id,
          author: 'agent',
          name: 'Support Agent',
          text: 'Hi! I\'d be happy to help you with your order. Can you please provide your order number?',
          created_at: new Date(Date.now() - 30000).toISOString() // 30 seconds ago
        },
        {
          conversation_id: conv.id,
          author: 'customer',
          name: 'Customer',
          text: 'My order number is #12345. I haven\'t received any updates.',
          created_at: new Date().toISOString() // now
        }
      ];

      const { data, error } = await supabase
        .from('messages')
        .insert(messages);

      if (error) {
        console.error(`Error adding messages for ${conv.title}:`, error);
      } else {
        console.log(`✅ Added ${messages.length} messages for ${conv.title}`);
      }
    }

    console.log('🎉 Seeding completed!');
  } catch (error) {
    console.error('Error seeding messages:', error);
  }
}

seedMessages();
