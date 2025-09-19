"use client";
import { useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TestPage() {
  const [results, setResults] = useState<string[]>([]);
  const [testName, setTestName] = useState("Test User");
  const [testEmail, setTestEmail] = useState("test@example.com");

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearResults = () => {
    setResults([]);
  };

  const testCustomerCreation = async () => {
    addResult("🔄 Testing customer creation...");
    try {
      const client = getSupabaseBrowser();
      if (!client) {
        addResult("❌ Supabase client not available");
        return;
      }

      // Create domain-based organization
      const domain = "test.com";
      const orgSlug = `widget-${domain.replace(/[^a-zA-Z0-9-]/g, '-')}`;
      const orgName = `${domain} (Widget)`;
      
      addResult(`🌐 Creating organization: ${orgName} (${orgSlug})`);
      
      let orgId = null;
      const { data: existingOrg } = await client
        .from("organizations")
        .select("id")
        .eq("slug", orgSlug)
        .maybeSingle();
      
      if (existingOrg) {
        orgId = existingOrg.id;
        addResult(`✅ Found existing organization: ${orgId}`);
      } else {
        const { data: newOrg, error: orgError } = await client
          .from("organizations")
          .insert({
            name: orgName,
            slug: orgSlug
          })
          .select("id")
          .single();
        
        if (orgError) {
          addResult(`❌ Error creating organization: ${orgError.message}`);
          return;
        } else {
          orgId = newOrg.id;
          addResult(`✅ Created organization: ${orgId}`);
        }
      }

      // Create customer
      addResult(`👤 Creating customer: ${testName} (${testEmail})`);
      const { data: newCustomer, error: customerError } = await client
        .from("customers")
        .upsert({
          display_name: testName,
          email: testEmail,
          status: "ACTIVE",
          org_id: orgId,
        }, {
          onConflict: 'email',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (customerError) {
        addResult(`❌ Error creating customer: ${customerError.message}`);
        return;
      }

      addResult(`✅ Customer created: ${newCustomer.id}`);
      
      // Test conversation creation
      addResult(`💬 Testing conversation creation...`);
      const { data: newConversation, error: convError } = await client
        .from("conversations")
        .insert({
          customer_id: newCustomer.id,
          org_id: newCustomer.org_id, // Include org_id
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (convError) {
        addResult(`❌ Error creating conversation: ${convError.message}`);
        return;
      }

      addResult(`✅ Conversation created: ${newConversation.id}`);

      // Test message creation
      addResult(`📝 Testing message creation...`);
      const { data: newMessage, error: msgError } = await client
        .from("messages")
        .insert({
          conversation_id: newConversation.id,
          sender_type: "CUSTOMER",
          customer_id: newCustomer.id,
          org_id: newCustomer.org_id, // Include org_id
          body_text: "Test message from widget test page"
        })
        .select("id")
        .single();

      if (msgError) {
        addResult(`❌ Error creating message: ${msgError.message}`);
        return;
      }

      addResult(`✅ Message created: ${newMessage.id}`);
      addResult(`🎉 All tests passed! Customer, conversation, and message created successfully.`);

    } catch (error) {
      addResult(`❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Widget Flow Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Test Name:</label>
              <Input
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Enter test name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Test Email:</label>
              <Input
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="Enter test email"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={testCustomerCreation} className="flex-1">
                Run Complete Test
              </Button>
              <Button onClick={clearResults} variant="outline">
                Clear Results
              </Button>
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
                <p className="text-gray-500">No test results yet. Click "Run Complete Test" to start.</p>
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
