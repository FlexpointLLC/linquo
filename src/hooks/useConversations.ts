"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Conversation = {
  id: string;
  title: string;
  last_message_at: string | null;
};

export function useConversations() {
  const [data, setData] = useState<Conversation[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    let unsub: (() => void) | undefined;

    async function load() {
      try {
        if (!client) {
          setData([
            { id: "1", title: "Acme Inc.", last_message_at: null },
            { id: "2", title: "John Doe", last_message_at: null },
          ]);
          return;
        }
        const { data, error } = await client
          .from("conversations")
          .select("id,title,last_message_at")
          .order("last_message_at", { ascending: false, nullsFirst: false });
        if (error) throw error;
        setData(data as Conversation[]);

        const channel = client
          .channel("conv_changes")
          .on(
            "postgres_changes" as any,
            { event: "*", schema: "public", table: "conversations" },
            () => {
              // Reload list on any change
              client
                .from("conversations")
                .select("id,title,last_message_at")
                .order("last_message_at", { ascending: false, nullsFirst: false })
                .then(({ data }) => setData(data as Conversation[]));
            }
          )
          .subscribe();
        unsub = () => {
          client.removeChannel(channel);
        };
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load conversations");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      if (unsub) unsub();
    };
  }, []);

  return { data, loading, error };
}


