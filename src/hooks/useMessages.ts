"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type DbMessage = {
  id: string;
  conversation_id: string;
  sender_type: "AGENT" | "CUSTOMER" | "SYSTEM" | "BOT";
  agent_id: string | null;
  customer_id: string | null;
  body_text: string;
  created_at: string;
};

export function useMessages(conversationId: string | null) {
  const [data, setData] = useState<DbMessage[] | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("🔄 useMessages hook triggered with conversationId:", conversationId);
    const client = getSupabaseBrowser();
    if (!conversationId) {
      console.log("❌ No conversationId provided to useMessages");
      return;
    }
    let unsub: (() => void) | undefined;

    async function load() {
      try {
        if (!client || !conversationId) {
          console.log("❌ Missing client or conversationId in useMessages");
          setData([]);
          return;
        }
        console.log("🔍 Loading messages for conversation:", conversationId);
        const { data, error } = await client
          .from("messages")
          .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        
        if (error) {
          console.error("❌ Error loading messages:", error);
          throw error;
        }
        
        console.log("✅ Messages loaded:", data?.length || 0, "messages");
        setData(data as DbMessage[]);

        const channel = client
          .channel(`msg_changes_${conversationId}`)
          .on(
            "postgres_changes" as never,
            { event: "insert", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
            (payload: { new: DbMessage }) => {
              setData((prev) => (prev ? [...prev, payload.new] : [payload.new]));
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


