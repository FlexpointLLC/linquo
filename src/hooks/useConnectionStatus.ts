"use client";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";

export type ConnectionStatus = "connected" | "disconnected";

export function useConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const { agent, loading, connectionStatus } = useAuth();
  const previousStatus = useRef<ConnectionStatus>("connected");
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);

  // Simplified connection status - just use auth status without complex logic
  useEffect(() => {
    if (!loading) {
      // Simple check: if we have connectionStatus from useAuth, use it
      if (connectionStatus === 'connected') {
        setStatus("connected");
      } else if (connectionStatus === 'disconnected') {
        setStatus("disconnected");
      }
    }
  }, [loading, connectionStatus]); // Fixed: ensure both dependencies are always defined

  // Manual refresh function for when user clicks the badge
  const refresh = () => {
    // Clear any pending reconnection
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }
    // Immediate reload when user clicks
    window.location.reload();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
    };
  }, []);

  return {
    status,
    refresh,
  };
}
