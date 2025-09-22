"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type Customer = { id: string; display_name: string; email: string; status: "ACTIVE" | "BLOCKED"; country?: string; created_at: string };

export function useCustomers() {
  const [data, setData] = useState<Customer[] | null>(null);
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
        
        // If agent is not available, don't clear data - keep existing customers
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await client
          .from("customers")
          .select("id,display_name,email,status,country,created_at")
          .eq("org_id", agent.org_id)
          .order("display_name");
        if (error) throw error;
        
        setData(data as Customer[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agent?.org_id]);

  return { data, loading, error };
}


