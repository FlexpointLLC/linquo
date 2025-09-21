"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const { agent, loading } = useAuth();

  const checkConnection = async () => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setStatus("disconnected");
      return;
    }

    try {
      // Only show checking if we don't already have a definitive status from auth
      if (status === "connected" || status === "disconnected") {
        setStatus("checking");
      }
      const startTime = Date.now();
      
      // Try a lightweight query to check connectivity
      const { error } = await supabase
        .from("organizations")
        .select("id")
        .limit(1);
      
      const endTime = Date.now();
      const latency = endTime - startTime;

      if (error) {
        setStatus("disconnected");
      } else {
        setStatus("connected");
      }
      
      setLastChecked(new Date());
    } catch (error) {
      setStatus("disconnected");
      setLastChecked(new Date());
    }
  };

  // React to auth changes immediately - this takes priority
  useEffect(() => {
    if (!loading) {
      // Check if agent data is available and has display_name
      if (agent && agent.display_name) {
        setStatus("connected");
      } else {
        // If agent is null or display_name is missing, show disconnected
        setStatus("disconnected");
      }
    }
  }, [agent, loading]);

  useEffect(() => {
    // Only do periodic checks if we don't have auth-based status
    const supabase = getSupabaseBrowser();
    if (supabase) {
      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          setStatus("disconnected");
        } else if (event === 'SIGNED_IN' && session) {
          setStatus("connected");
        }
      });

      // Initial check
      checkConnection();

      // Check connection every 30 seconds
      const interval = setInterval(checkConnection, 30000);

      return () => {
        clearInterval(interval);
        subscription.unsubscribe();
      };
    }
  }, []);

  return {
    status,
    lastChecked,
    checkConnection,
  };
}
