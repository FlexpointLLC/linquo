"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const { agent, loading } = useAuth();

  // Pure frontend check - no backend calls
  useEffect(() => {
    if (!loading) {
      // Check if agent has display_name and email (same logic as avatar menu)
      if (agent && agent.display_name && agent.email) {
        setStatus("connected");
      } else {
        // If agent is null, display_name is missing, or email is missing, show disconnected
        setStatus("disconnected");
      }
    }
  }, [agent, loading]);

  // Manual refresh function for when user clicks the badge
  const refresh = () => {
    // Just reload the page to refresh everything
    window.location.reload();
  };

  return {
    status,
    refresh,
  };
}
