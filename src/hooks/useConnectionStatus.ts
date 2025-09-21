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

  // Auto soft reload when status changes to disconnected
  useEffect(() => {
    // Only trigger soft reload if status changed from connected to disconnected
    if (previousStatus.current === "connected" && status === "disconnected") {
      console.log("🔄 Connection lost, scheduling soft reload in 5 minutes...");
      
      // Clear any existing timeout
      if (softReloadTimeout.current) {
        clearTimeout(softReloadTimeout.current);
      }
      
      // Schedule soft reload after 30 seconds for immediate recovery
      softReloadTimeout.current = setTimeout(() => {
        console.log("🔄 Executing soft reload...");
        window.location.reload();
      }, 30000);
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
