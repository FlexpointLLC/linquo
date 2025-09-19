"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { user, agent, organization, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If user exists but no agent/organization, show setup message
  if (!agent || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold mb-4">Account Setup Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            {!agent && !organization 
              ? "Your account is being set up. Please wait a moment or refresh the page."
              : "Your account needs to be set up with an organization. Please contact your administrator or create a new account."
            }
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => {
                // Refresh the page to retry loading user data
                window.location.reload();
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Refresh Page
            </button>
            <button
              onClick={() => {
                // Sign out and redirect to signup
                const supabase = getSupabaseBrowser();
                if (supabase) {
                  supabase.auth.signOut();
                }
                router.push("/signup");
              }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Create New Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
