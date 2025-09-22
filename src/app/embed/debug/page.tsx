"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function DebugPage() {
  const [status, setStatus] = useState<string>("Loading...");
  const [supabaseStatus, setSupabaseStatus] = useState<string>("Checking...");

  useEffect(() => {
    async function checkStatus() {
      try {
        // Check if Supabase client is available
        const client = getSupabaseBrowser();
        if (!client) {
          setSupabaseStatus("❌ Supabase client not available");
          setStatus("❌ Failed: No Supabase client");
          return;
        }

        setSupabaseStatus("✅ Supabase client available");

        // Test database connection
        const { error } = await client
          .from("customers")
          .select("count")
          .limit(1);

        if (error) {
          setStatus(`❌ Database error: ${error.message}`);
        } else {
          setStatus("✅ Database connection successful");
        }

        // Test creating a customer with domain-based organization
        const testDomain = "test.com";
        const orgSlug = `widget-${testDomain.replace(/[^a-zA-Z0-9-]/g, '-')}`;
        const orgName = `${testDomain} (Widget)`;
        
        let orgId = null;
        
        // Try to find existing organization for test domain
        const { data: existingOrg } = await client
          .from("organizations")
          .select("id")
          .eq("slug", orgSlug)
          .maybeSingle();
        
        if (existingOrg) {
          orgId = existingOrg.id;
        } else {
          // Create new organization for test domain
          const { data: newOrg, error: orgError } = await client
            .from("organizations")
            .insert({
              name: orgName,
              slug: orgSlug
            })
            .select("id")
            .single();
          
          if (orgError) {
            setStatus(`❌ Organization creation failed: ${orgError.message}`);
            return;
          } else {
            orgId = newOrg.id;
          }
        }

        const testCustomer = {
          display_name: "Test User",
          email: `test-${Date.now()}@example.com`,
          status: "ACTIVE" as const,
          org_id: orgId,
          created_at: new Date().toISOString(),
        };

        const { data: newCustomer, error: createError } = await client
          .from("customers")
          .insert(testCustomer)
          .select()
          .single();

        if (createError) {
          setStatus(`❌ Customer creation failed: ${createError.message}`);
        } else {
          setStatus(`✅ Customer created successfully: ${newCustomer.id}`);
          
          // Clean up test customer
          await client.from("customers").delete().eq("id", newCustomer.id);
        }

      } catch (error) {
        setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    checkStatus();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Widget Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Supabase Connection:</h2>
          <p>{supabaseStatus}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Database Test:</h2>
          <p>{status}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <p>SUPABASE_URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing"}</p>
          <p>SUPABASE_ANON_KEY: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing"}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold mb-2">Next Steps:</h2>
          <p>1. Check if all statuses show ✅</p>
          <p>2. If ❌, check your .env.local file</p>
          <p>3. Test the widget at: <a href="/embed?site=test.com" className="text-blue-500 underline">/embed?site=test.com</a></p>
        </div>
      </div>
    </div>
  );
}
