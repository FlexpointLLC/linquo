"use client";

import { useCurrentAgent } from "@/hooks/useCurrentAgent";
import { AgentLogin } from "./agent-login";
import { useAgents } from "@/hooks/useAgents";
import { useEffect } from "react";

export function DashboardWrapper({ children }: { children: React.ReactNode }) {
  const { currentAgent, loading, setAgent } = useCurrentAgent();
  const { data: agents } = useAgents();

  // Auto-login with first agent if no agent is selected (for demo purposes)
  useEffect(() => {
    if (!loading && !currentAgent && agents && agents.length > 0) {
      console.log("Auto-logging in with first agent:", agents[0]);
      setAgent(agents[0]);
    }
  }, [loading, currentAgent, agents, setAgent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentAgent) {
    return <AgentLogin />;
  }

  return <>{children}</>;
}
