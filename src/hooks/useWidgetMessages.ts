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

export function useWidgetMessages(conversationId: string | null) {
  const [data, setData] = useState<DbMessage[] | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!conversationId) {
      setData([]);
      setLoading(false);
      return;
    }
    let unsub: (() => void) | undefined;

    async function load() {
      try {
        if (!client || !conversationId) {
          console.log("❌ Widget messages: No client or conversationId", { client: !!client, conversationId });
          setData([]);
          setLoading(false);
          return;
        }
        
        console.log("🔍 Widget messages: Loading messages for conversation:", conversationId);
        
        // Widget messages - no organization filter needed
        const { data, error } = await client
          .from("messages")
          .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true });
        
        if (error) {
          console.log("❌ Widget messages: Error loading messages:", error);
          throw error;
        }
        
        console.log("✅ Widget messages: Loaded messages:", data?.length || 0, "messages");
        setData(data as DbMessage[]);

        // Enable realtime subscription for message syncing
        const channel = client
          .channel(`widget_msg_changes_${conversationId}`)
          .on(
            "postgres_changes" as never,
            { event: "insert", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
            (payload: { new: DbMessage }) => {
              setData((prev) => {
                if (!prev) return [payload.new];
                
                // Check if message already exists to prevent duplicates
                const exists = prev.some(msg => msg.id === payload.new.id);
                if (exists) {
                  return prev; // Don't add duplicate
                }
                
                // Add new message and sort by created_at
                const updated = [...prev, payload.new];
                return updated.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              });
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
