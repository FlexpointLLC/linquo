"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

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
  const { agent } = useAuth();

  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!conversationId) {
      return;
    }
    let unsub: (() => void) | undefined;

    async function load() {
      try {
        if (!client || !conversationId) {
          setData([]);
          return;
        }
        
        // If agent is not available, don't clear data - keep existing messages
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await client
          .from("messages")
          .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at")
          .eq("conversation_id", conversationId)
          .eq("org_id", agent.org_id)
          .order("created_at", { ascending: true });
        
        if (error) {
          // Error loading messages
          throw error;
        }
        
        setData(data as DbMessage[]);

        // Enable realtime subscription for message syncing
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
  }, [conversationId, agent?.org_id]);

  return { data, loading, error };
}


