// Browser Console Test for Widget Issues
// Copy and paste this into your browser console on the widget page

async function testWidgetFlow() {
  console.log("🧪 Starting widget flow test...");
  
  try {
    // Import Supabase client
    const { getSupabaseBrowser } = await import("/src/lib/supabase-browser.ts");
    const client = getSupabaseBrowser();
    
    if (!client) {
      console.error("❌ Supabase client not available");
      return;
    }
    
    console.log("✅ Supabase client available");
    
    // Test 1: Check if we can read customers
    console.log("🔍 Testing customer read...");
    const { data: customers, error: customerError } = await client
      .from("customers")
      .select("*")
      .limit(1);
    
    if (customerError) {
      console.error("❌ Error reading customers:", customerError);
    } else {
      console.log("✅ Customers read successfully:", customers?.length || 0, "customers");
    }
    
    // Test 2: Check if we can read conversations
    console.log("🔍 Testing conversation read...");
    const { data: conversations, error: convError } = await client
      .from("conversations")
      .select("*")
      .limit(1);
    
    if (convError) {
      console.error("❌ Error reading conversations:", convError);
    } else {
      console.log("✅ Conversations read successfully:", conversations?.length || 0, "conversations");
    }
    
    // Test 3: Try to create a conversation
    if (customers && customers.length > 0) {
      console.log("🔍 Testing conversation creation...");
      const { data: newConv, error: createError } = await client
        .from("conversations")
        .insert({
          customer_id: customers[0].id,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      
      if (createError) {
        console.error("❌ Error creating conversation:", createError);
      } else {
        console.log("✅ Conversation created successfully:", newConv.id);
      }
    }
    
    // Test 4: Check messages table
    console.log("🔍 Testing message read...");
    const { data: messages, error: msgError } = await client
      .from("messages")
      .select("*")
      .limit(1);
    
    if (msgError) {
      console.error("❌ Error reading messages:", msgError);
    } else {
      console.log("✅ Messages read successfully:", messages?.length || 0, "messages");
    }
    
  } catch (error) {
    console.error("❌ Unexpected error:", error);
  }
}

// Run the test
testWidgetFlow();

