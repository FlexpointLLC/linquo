"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Agent = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function useCurrentAgent() {
  const [currentAgent, setCurrentAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load current agent from localStorage on mount
  useEffect(() => {
    const loadCurrentAgent = () => {
      try {
        const stored = localStorage.getItem("linquo_current_agent");
        if (stored) {
          const agent = JSON.parse(stored) as Agent;
          setCurrentAgent(agent);
        }
      } catch (e) {
        // Error loading current agent
        setError("Failed to load current agent");
      } finally {
        setLoading(false);
      }
    };

    loadCurrentAgent();
  }, []);

  const loginAgent = async (email: string, _password: string): Promise<Agent | null> => {
    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseBrowser();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      // For now, we'll do a simple lookup by email
      // In a real app, you'd have proper authentication
      const { data: agents, error } = await client
        .from("agents")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        throw new Error("Agent not found");
      }

      if (agents) {
        const agent = agents as Agent;
        setCurrentAgent(agent);
        localStorage.setItem("linquo_current_agent", JSON.stringify(agent));
        return agent;
      }

      return null;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Login failed";
      setError(errorMessage);
      // Login error
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logoutAgent = () => {
    setCurrentAgent(null);
    localStorage.removeItem("linquo_current_agent");
  };

  const setAgent = (agent: Agent) => {
    setCurrentAgent(agent);
    localStorage.setItem("linquo_current_agent", JSON.stringify(agent));
  };

  return {
    currentAgent,
    loading,
    error,
    loginAgent,
    logoutAgent,
    setAgent,
  };
}
