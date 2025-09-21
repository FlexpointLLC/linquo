"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type Agent = { id: string; display_name: string; email: string; online_status: string };

export function useAgents() {
  const [data, setData] = useState<Agent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuth();

  useEffect(() => {
    const client = getSupabaseBrowser();
    async function load() {
      try {
        if (!client) {
          setData([]);
          setLoading(false);
          return;
        }
        
        // If agent is not available, don't clear data - keep existing agents
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await client
          .from("agents")
          .select("id,display_name,email,online_status")
          .eq("org_id", agent.org_id)
          .order("display_name");
        if (error) throw error;
        setData(data as Agent[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load agents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agent?.org_id]);

  return { data, loading, error };
}


