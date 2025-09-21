"use client";
import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Organization = {
  id: string;
  name: string;
  slug: string;
  brand_color?: string;
};

export function useOrganization(orgId: string | null) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) {
      setOrganization(null);
      setLoading(false);
      return;
    }

    const client = getSupabaseBrowser();
    if (!client) {
      setError("Supabase client not available");
      setLoading(false);
      return;
    }

    const fetchOrganization = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await client
          .from("organizations")
          .select("id, name, slug, brand_color")
          .eq("id", orgId)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setOrganization(data as Organization);
      } catch (err) {
        console.error("Error fetching organization:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch organization");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgId]);

  return { organization, loading, error };
}
