"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const { agent, loading } = useAuth();
  const previousStatus = useRef<ConnectionStatus>("connected");
  const softReloadTimeout = useRef<NodeJS.Timeout | null>(null);

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

  // Auto soft reload when status changes to disconnected
  useEffect(() => {
    // Only trigger soft reload if status changed from connected to disconnected
    if (previousStatus.current === "connected" && status === "disconnected") {
      console.log("🔄 Connection lost, scheduling soft reload in 2 seconds...");
      
      // Clear any existing timeout
      if (softReloadTimeout.current) {
        clearTimeout(softReloadTimeout.current);
      }
      
      // Schedule soft reload after 2 seconds
      softReloadTimeout.current = setTimeout(() => {
        console.log("🔄 Executing soft reload...");
        window.location.reload();
      }, 2000);
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
