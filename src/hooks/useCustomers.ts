"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Customer = { id: string; display_name: string; email: string; status: "ACTIVE" | "BLOCKED"; country?: string };

export function useCustomers() {
  const [data, setData] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    async function load() {
      try {
        if (!client) {
          setData([]);
          setLoading(false);
          return;
        }
        const { data, error } = await client.from("customers").select("id,display_name,email,status,country").order("display_name");
        if (error) throw error;
        setData(data as Customer[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return { data, loading, error };
}


