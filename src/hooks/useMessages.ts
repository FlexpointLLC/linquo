"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type DbMessage = {
  id: string;
  conversation_id: string;
  author: "agent" | "customer";
  name: string;
  text: string;
  created_at: string;
};

export function useMessages(conversationId: string | null) {
  const [data, setData] = useState<DbMessage[] | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!conversationId) return;
    let unsub: (() => void) | undefined;

    async function load() {
      try {
        if (!client) {
          setData([
            { id: "m1", conversation_id: conversationId, author: "customer", name: "John Doe", text: "Hi", created_at: new Date().toISOString() },
            { id: "m2", conversation_id: conversationId, author: "agent", name: "You", text: "Hello", created_at: new Date().toISOString() },
          ]);
          return;
        }
        const { data, error } = await client
          .from("messages")
          .select("id,conversation_id,author,name,text,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        setData(data as DbMessage[]);

        const channel = client
          .channel(`msg_changes_${conversationId}`)
          .on(
            "postgres_changes",
            { event: "insert", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
            (payload) => {
              setData((prev) => (prev ? [...prev, payload.new as DbMessage] : [payload.new as DbMessage]));
            }
          )
          .subscribe();
        unsub = () => client.removeChannel(channel);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => {
      if (unsub) unsub();
    };
  }, [conversationId]);

  return { data, loading, error };
}


