"use client";

import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check session on mount and handle redirects
  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient();

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          router.push("/login");
          return;
        }

        if (!session?.user) {
          // No valid session, redirect to login
          router.push("/login");
          return;
        }

        // Session exists, allow dashboard to load
        setIsCheckingSession(false);
      } catch (error) {
        console.error("Session check failed:", error);
        router.push("/login");
      }
    };

    checkSession();
  }, [router]);

  // Show loading while checking session
  if (isCheckingSession || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If no user after loading, show redirect message
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User exists, allow dashboard to load
  return <>{children}</>;
}
