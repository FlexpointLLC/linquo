"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function DebugSignupForm() {
  const [formData, setFormData] = useState({
    name: "Test User",
    email: "",
    password: "TestPassword123!",
    organizationName: "Test Company",
    organizationSlug: "test-company",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const router = useRouter();

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setLogs([]);

    try {
      addLog("🚀 Starting debug signup process...");
      
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }
      addLog("✅ Supabase client available");

      // Test 1: Check if we can connect to Supabase
      addLog("🔍 Testing Supabase connection...");
      const { data: testData, error: testError } = await supabase
        .from("organizations")
        .select("count")
        .limit(1);
      
      if (testError) {
        addLog(`❌ Supabase connection test failed: ${testError.message}`);
        throw testError;
      }
      addLog("✅ Supabase connection test passed");

      // Test 2: Create user
      addLog("📧 Creating user account...");
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.name,
            name: formData.name,
          }
        }
      });

      if (authError) {
        addLog(`❌ Auth error: ${authError.message}`);
        throw authError;
      }

      if (!authData.user) {
        addLog("❌ No user created");
        throw new Error("Failed to create user account");
      }

      addLog(`✅ User created successfully: ${authData.user.id}`);
      addLog(`📧 Email confirmed: ${!!authData.user.email_confirmed_at}`);

      // Test 3: Create organization
      addLog("🏢 Creating organization...");
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.organizationName,
          slug: formData.organizationSlug,
        })
        .select()
        .single();

      if (orgError) {
        addLog(`❌ Organization creation failed: ${orgError.message}`);
        addLog(`❌ Organization error details: ${JSON.stringify(orgError)}`);
        throw orgError;
      }

      addLog(`✅ Organization created successfully: ${orgData.id}`);

      // Test 4: Create agent
      addLog("👤 Creating agent record...");
      const { error: agentError } = await supabase
        .from("agents")
        .insert({
          name: formData.name,
          email: formData.email,
          role: "owner",
          organization_id: orgData.id,
          user_id: authData.user.id,
        });

      if (agentError) {
        addLog(`❌ Agent creation failed: ${agentError.message}`);
        addLog(`❌ Agent error details: ${JSON.stringify(agentError)}`);
        throw agentError;
      }

      addLog("✅ Agent created successfully");
      addLog("🎉 Signup process completed successfully!");

      // Redirect to dashboard
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);

    } catch (error) {
      addLog(`❌ Signup error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setError(error instanceof Error ? error.message : "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Debug Signup Form</CardTitle>
            <CardDescription>
              This form will help us debug the signup process step by step
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Your Name</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="test@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    value={formData.password}
                    onChange={(value) => handleInputChange("password", value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationName">Organization Name</Label>
                  <Input
                    id="organizationName"
                    type="text"
                    value={formData.organizationName}
                    onChange={(e) => handleInputChange("organizationName", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2 col-span-2">
                  <Label htmlFor="organizationSlug">Organization URL</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">linquo.com/</span>
                    <Input
                      id="organizationSlug"
                      type="text"
                      value={formData.organizationSlug}
                      onChange={(e) => handleInputChange("organizationSlug", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account (Debug Mode)"}
              </Button>
            </form>

            {/* Debug Logs */}
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Debug Logs:</h3>
              <div className="bg-gray-100 p-3 rounded-md max-h-64 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-sm text-gray-500">No logs yet...</p>
                ) : (
                  logs.map((log, index) => (
                    <p key={index} className="text-xs font-mono mb-1">{log}</p>
                  ))
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
