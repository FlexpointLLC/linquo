"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Conversation = {
  id: string;
  title?: string;
  customer_id: string;
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
          setData([]);
          setLoading(false);
          return;
        }
        const { data, error } = await client
          .from("conversations")
          .select("id,customer_id,last_message_at")
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(100);
        
        if (error) {
          throw error;
        }
        // Set data even if it's an empty array (no conversations)
        setData(data as Conversation[] || []);

        // Temporarily disable realtime to reduce connection usage
        // const channel = client
        //   .channel("conv_changes")
        //   .on(
        //     "postgres_changes" as never,
        //     { event: "*", schema: "public", table: "conversations" },
        //     () => {
        //       // Reload list on any change
        //       client
        //         .from("conversations")
        //         .select("id,last_message_at")
        //         .order("last_message_at", { ascending: false, nullsFirst: false })
        //         .limit(100)
        //         .then(({ data }) => setData(data as Conversation[] || []));
        //     }
        //   )
        //   .subscribe();
        // unsub = () => {
        //   client.removeChannel(channel);
        // };
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


