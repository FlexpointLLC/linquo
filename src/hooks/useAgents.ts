"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Agent = { id: string; name: string; email: string; role: string };

export function useAgents() {
  const [data, setData] = useState<Agent[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    async function load() {
      try {
        if (!client) {
          setData([
            { id: "a1", name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
            { id: "a2", name: "Bob Smith", email: "bob@example.com", role: "Agent" },
          ]);
          return;
        }
        const { data, error } = await client.from("agents").select("id,name,email,role").order("name");
        if (error) throw error;
        setData(data as Agent[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load agents");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}


