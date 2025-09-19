"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

export function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organizationName: "",
    organizationSlug: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate organization slug from name
    if (field === "organizationName") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') // Remove leading/trailing dashes
        .trim();
      setFormData(prev => ({ ...prev, organizationSlug: slug }));
    }
    
    // Handle organization slug changes directly
    if (field === "organizationSlug") {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing dashes
      setFormData(prev => ({ ...prev, organizationSlug: slug }));
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        }
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Google signup error:", error);
      setError(error instanceof Error ? error.message : "Google signup failed");
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate organization slug
    if (!formData.organizationSlug || formData.organizationSlug.length < 3) {
      setError("Organization URL must be at least 3 characters long");
      setIsLoading(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      console.log("🚀 Starting signup process...");
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        throw new Error("Supabase client not available");
      }
      console.log("✅ Supabase client available");

      // 1. Sign up the user
      console.log("📧 Creating user account...", { email: formData.email });
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

      console.log("🔍 Auth result:", { authData, authError });

      if (authError) {
        console.error("❌ Auth error:", authError);
        throw authError;
      }

      if (!authData.user) {
        console.error("❌ No user created");
        throw new Error("Failed to create user account");
      }

      console.log("✅ User created successfully:", authData.user.id);
      console.log("📧 Email confirmation required:", !authData.user.email_confirmed_at);

      // 1.5. Update user profile with display name
      console.log("👤 Updating user profile...");
      const { error: profileError } = await supabase.auth.updateUser({
        data: {
          full_name: formData.name,
          name: formData.name,
        }
      });

      if (profileError) {
        console.warn("⚠️ Profile update failed (non-critical):", profileError);
      } else {
        console.log("✅ User profile updated successfully");
      }

      // 2. Create organization
      console.log("🏢 Creating organization...", { 
        name: formData.organizationName, 
        slug: formData.organizationSlug 
      });
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: formData.organizationName,
          slug: formData.organizationSlug,
        })
        .select()
        .single();

      console.log("🔍 Organization result:", { orgData, orgError });

      if (orgError) {
        console.error("❌ Organization creation failed:", orgError);
        throw orgError;
      }

      console.log("✅ Organization created successfully:", orgData.id);

      // 3. Create agent record (owner)
      console.log("👤 Creating agent record...", { 
        name: formData.name, 
        email: formData.email,
        organization_id: orgData.id,
        user_id: authData.user.id
      });
      const { error: agentError } = await supabase
        .from("agents")
        .insert({
          name: formData.name,
          email: formData.email,
          role: "owner",
          organization_id: orgData.id,
          user_id: authData.user.id,
        });

      console.log("🔍 Agent result:", { agentError });

      if (agentError) {
        console.error("❌ Agent creation failed:", agentError);
        throw agentError;
      }

      console.log("✅ Agent created successfully");

      // 4. Show success message and redirect
      if (!authData.user.email_confirmed_at) {
        alert("Account created successfully! Please check your email to confirm your account before signing in.");
      }
      router.push("/dashboard");

    } catch (error) {
      console.error("❌ Signup error:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        setError(String(error.message));
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create Your Account</CardTitle>
          <CardDescription>
            Set up your organization and start using Linquo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="John Doe"
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
                placeholder="john@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a strong password"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                type="text"
                value={formData.organizationName}
                onChange={(e) => handleInputChange("organizationName", e.target.value)}
                placeholder="Flexpoint LLC"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationSlug">Organization URL</Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">linquo.com/</span>
                <Input
                  id="organizationSlug"
                  type="text"
                  value={formData.organizationSlug}
                  onChange={(e) => handleInputChange("organizationSlug", e.target.value)}
                  placeholder="flexpoint-llc"
                  required
                  pattern="[a-z0-9-]+"
                  minLength={3}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                This will be your organization&apos;s unique URL
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-primary hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
