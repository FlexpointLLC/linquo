"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const { agent, loading, connectionStatus } = useAuth();
  const previousStatus = useRef<ConnectionStatus>("connected");
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

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
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      // Simple reconnection: just reload the page after a short delay
      // This is more reliable than trying to refresh the auth state
      reconnectTimeout.current = setTimeout(() => {
        console.log("🔄 Reloading page to restore connection...");
        window.location.reload();
      }, 2000);
    }
    
    // Update previous status
    previousStatus.current = status;
    
    // Cleanup timeout on unmount
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, [status]);

  // Manual refresh function for when user clicks the badge
  const refresh = () => {
    // Clear any pending reconnection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    // Immediate reload when user clicks
    window.location.reload();
  };

  return {
    status,
    refresh,
  };
}
