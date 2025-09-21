"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type ConnectionStatus = "connected" | "disconnected" | "checking";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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

  useEffect(() => {
    // Check connection immediately
    checkConnection();

    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    lastChecked,
    checkConnection,
  };
}
