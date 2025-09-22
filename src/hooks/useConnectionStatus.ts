"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const { agent, loading, connectionStatus } = useAuth();
  const previousStatus = useRef<ConnectionStatus>("connected");
  const softReloadTimeout = useRef<NodeJS.Timeout | null>(null);

  // Use connection status from useAuth and also check agent data
  useEffect(() => {
    if (!loading) {
      // Check both connection status and agent data
      if (connectionStatus === 'connected' && agent && agent.display_name && agent.email) {
        setStatus("connected");
      } else {
        // If connection is lost or agent data is missing, show disconnected
        setStatus("disconnected");
      }
    }
  }, [agent, loading, connectionStatus]);

  // Auto reconnection when status changes to disconnected
  useEffect(() => {
    // Only trigger reconnection if status changed from connected to disconnected
    if (previousStatus.current === "connected" && status === "disconnected") {
      console.log("🔄 Connection lost, attempting automatic reconnection...");
      
      // Clear any existing timeout
      if (softReloadTimeout.current) {
        clearTimeout(softReloadTimeout.current);
      }
      
      // Try to reconnect by refreshing auth state first
      const attemptReconnection = async () => {
        try {
          console.log("🔄 Attempting to restore connection...");
          
          // Try to refresh the auth session
          const { getSupabaseBrowser } = await import("@/lib/supabase-browser");
          const supabase = getSupabaseBrowser();
          if (supabase) {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
              console.error("❌ Error getting session:", error);
            } else if (session) {
              console.log("✅ Session restored, connection should be back");
              return; // Session restored, no need to reload
            }
          }
          
          // If session refresh didn't work, try a soft reload as fallback
          console.log("🔄 Session refresh failed, falling back to soft reload...");
          window.location.reload();
        } catch (error) {
          console.error("❌ Reconnection attempt failed:", error);
          // Fallback to page reload
          window.location.reload();
        }
      };
      
      // Attempt reconnection after a short delay
      softReloadTimeout.current = setTimeout(attemptReconnection, 2000);
    }
    
    // Update previous status
    previousStatus.current = status;
    
    // Cleanup timeout on unmount
    return () => {
      if (softReloadTimeout.current) {
        clearTimeout(softReloadTimeout.current);
      }
    };
  }, [status]);

  // Manual refresh function for when user clicks the badge
  const refresh = () => {
    // Clear any pending soft reload
    if (softReloadTimeout.current) {
      clearTimeout(softReloadTimeout.current);
    }
    // Immediate reload when user clicks
    window.location.reload();
  };

  return {
    status,
    refresh,
  };
}
