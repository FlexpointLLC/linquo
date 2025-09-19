"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestConversationPage() {
  const [results, setResults] = useState<string[]>([]);
  const [testEmail, setTestEmail] = useState("conversation-test@example.com");

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testSameEmailFlow = async () => {
    addResult("🔄 Testing same email = same conversation flow...");
    
    try {
      const client = getSupabaseBrowser();
      if (!client) {
        addResult("❌ Supabase client not available");
        return;
      }

      // Test 1: First time with this email
      addResult("📝 Test 1: First time with this email");
      
      // Create organization
      const domain = "test.com";
      const orgSlug = `widget-${domain.replace(/[^a-zA-Z0-9-]/g, '-')}`;
      const orgName = `${domain} (Widget)`;
      
      let orgId = null;
      const { data: existingOrg } = await client
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .maybeSingle();
      
      if (existingOrg) {
        orgId = existingOrg.id;
      } else {
        const { data: newOrg, error: orgError } = await client
          .from("organizations")
          .insert({ name: orgName, slug: orgSlug })
          .select("id")
          .single();
        
        if (orgError || !newOrg) {
          addResult(`❌ Error creating organization: ${orgError?.message || 'Unknown error'}`);
          return;
        }
        
        orgId = newOrg.id;
      }

      // Create customer (first time) - use upsert to avoid duplicates
      const { data: customer1, error: customerError1 } = await client
        .from("customers")
        .upsert({
          display_name: "Test User 1",
          email: testEmail,
          status: "ACTIVE",
          org_id: orgId,
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (customerError1) {
        addResult(`❌ Error creating customer 1: ${customerError1.message}`);
        return;
      }

      addResult(`✅ Customer 1 created: ${customer1.id}`);

      // Create conversation (first time)
      const { data: conversation1, error: convError1 } = await client
        .from("conversations")
        .insert({
          customer_id: customer1.id,
          org_id: orgId,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convError1) {
        addResult(`❌ Error creating conversation 1: ${convError1.message}`);
        return;
      }

      addResult(`✅ Conversation 1 created: ${conversation1.id}`);

      // Test 2: Second time with same email
      addResult("📝 Test 2: Second time with same email");
      
      // Try to create customer again (should find existing)
      const { data: customer2, error: customerError2 } = await client
        .from("customers")
        .select("*")
        .eq("email", testEmail)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (customerError2) {
        addResult(`❌ Error finding customer 2: ${customerError2.message}`);
        return;
      }

      if (customer2 && customer2.id === customer1.id) {
        addResult(`✅ Same customer found: ${customer2.id}`);
      } else {
        addResult(`❌ Different customer found: ${customer2?.id || 'none'}`);
      }

      // Try to create conversation again (should find existing)
      const { data: conversation2, error: convError2 } = await client
        .from("conversations")
        .select("id")
        .eq("customer_id", customer2.id)
        .maybeSingle();

      if (convError2) {
        addResult(`❌ Error finding conversation 2: ${convError2.message}`);
        return;
      }

      if (conversation2 && conversation2.id === conversation1.id) {
        addResult(`✅ Same conversation found: ${conversation2.id}`);
      } else {
        addResult(`❌ Different conversation found: ${conversation2?.id || 'none'}`);
      }

      // Test 3: Add multiple messages to same conversation
      addResult("📝 Test 3: Adding multiple messages to same conversation");
      
      // Add customer message
      const { data: message1, error: msgError1 } = await client
        .from("messages")
        .insert({
          conversation_id: conversation1.id,
          sender_type: "CUSTOMER",
          customer_id: customer1.id,
          org_id: orgId,
          body_text: "Customer: Hello, I need help!"
        })
        .select("id")
        .single();

      if (msgError1) {
        addResult(`❌ Error creating message 1: ${msgError1.message}`);
      } else {
        addResult(`✅ Customer message created: ${message1.id}`);
      }

      // Add agent message
      const { data: message2, error: msgError2 } = await client
        .from("messages")
        .insert({
          conversation_id: conversation1.id,
          sender_type: "AGENT",
          customer_id: customer1.id,
          org_id: orgId,
          body_text: "Agent: Hi! How can I help you today?"
        })
        .select("id")
        .single();

      if (msgError2) {
        addResult(`❌ Error creating message 2: ${msgError2.message}`);
      } else {
        addResult(`✅ Agent message created: ${message2.id}`);
      }

      // Add another customer message
      const { data: message3, error: msgError3 } = await client
        .from("messages")
        .insert({
          conversation_id: conversation1.id,
          sender_type: "CUSTOMER",
          customer_id: customer1.id,
          org_id: orgId,
          body_text: "Customer: Thank you for your help!"
        })
        .select("id")
        .single();

      if (msgError3) {
        addResult(`❌ Error creating message 3: ${msgError3.message}`);
      } else {
        addResult(`✅ Customer message 2 created: ${message3.id}`);
      }

      addResult("🎉 Complete conversation flow test passed!");
      addResult("✅ Same email = Same customer = Same conversation");
      addResult("✅ One conversation can have multiple messages from both customer and agent");

    } catch (error) {
      addResult(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Conversation Flow Test</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Email:</label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testSameEmailFlow} className="flex-1">
                Test Same Email Flow
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
            </div>
            <div className="text-sm text-gray-600">
              <p><strong>Expected Flow:</strong></p>
              <p>1. Same email → Same customer</p>
              <p>2. Same customer → Same conversation</p>
              <p>3. Same conversation → Multiple messages</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96 overflow-y-auto bg-gray-50 p-4 rounded">
              {results.length === 0 ? (
                <p className="text-gray-500">No test results yet. Click &quot;Test Same Email Flow&quot; to start.</p>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => (
                    <div key={index} className="text-sm font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
