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
      setStatus("checking");
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

  // React to auth changes immediately
  useEffect(() => {
    if (!loading) {
      if (agent) {
        setStatus("connected");
      } else {
        setStatus("disconnected");
      }
    }
  }, [agent, loading]);

  useEffect(() => {
    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    // Monitor Supabase client for connection events
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

      return () => {
        clearInterval(interval);
        subscription.unsubscribe();
      };
    }

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    lastChecked,
    checkConnection,
  };
}
