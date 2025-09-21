"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
// import { getSupabaseBrowser } from "@/lib/supabase-browser";

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

  // If user exists but no agent/organization, show a warning but allow dashboard to load
  if (!agent || !organization) {
    console.log("⚠️ Dashboard: Missing agent/org data, but allowing dashboard to load", {
      hasAgent: !!agent,
      hasOrganization: !!organization,
      userId: user?.id
    });
    
    // Show a warning banner instead of blocking the entire dashboard
    return (
      <div className="min-h-screen">
        <div className="bg-yellow-50 border-b border-yellow-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-sm text-yellow-800">
                Account setup in progress. Some features may be limited.
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs text-yellow-600 hover:text-yellow-800 underline"
            >
              Refresh
            </button>
          </div>
        </div>
        {children}
      </div>
    );
  }

  return <>{children}</>;
}
