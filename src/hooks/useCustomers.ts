"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Customer = { id: string; name: string; email: string; status: "active" | "churned" | "trial"; website?: string };

export function useCustomers() {
  const [data, setData] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    async function load() {
      try {
        if (!client) {
          console.error("Supabase client not available");
          setError("Supabase client not available");
          return;
        }
        const { data, error } = await client.from("customers").select("id,name,email,status").order("name");
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


