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
    // Show content immediately to ensure tabs are clickable
    return <>{children}</>;
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

  // If user exists but no agent/organization, still allow dashboard to load
  if (!agent || !organization) {
    // Missing agent/org data, but allowing dashboard to load

    // Allow dashboard to load without warning banner
    return <>{children}</>;
  }

  return <>{children}</>;
}
