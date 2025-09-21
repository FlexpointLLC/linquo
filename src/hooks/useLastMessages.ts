"use client";
import { useEffect, useState, useMemo } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type LastMessage = {
  conversation_id: string;
  body_text: string;
  created_at: string;
};

export function useLastMessages(conversationIds: string[]) {
  const [data, setData] = useState<LastMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize the conversationIds to prevent infinite loops
  const memoizedConversationIds = useMemo(() => conversationIds, [conversationIds.join(',')]);

  useEffect(() => {
    if (!memoizedConversationIds.length) {
      setData([]);
      setLoading(false);
      return;
    }

    const client = getSupabaseBrowser();
    if (!client) {
      setError("Supabase client not available");
      setLoading(false);
      return;
    }

    async function loadLastMessages() {
      try {
        setLoading(true);
        setError(null);

        // Get the last message for each conversation
        const { data: messages, error } = await client
          .from("messages")
          .select("conversation_id, body_text, created_at")
          .in("conversation_id", memoizedConversationIds)
          .order("created_at", { ascending: false });

        if (error) {
          // Error loading last messages
          setError(error.message);
          return;
        }

        // Group by conversation_id and get the latest message for each
        const lastMessagesMap = new Map<string, LastMessage>();
        messages?.forEach((message) => {
          if (!lastMessagesMap.has(message.conversation_id)) {
            lastMessagesMap.set(message.conversation_id, message);
          }
        });

        setData(Array.from(lastMessagesMap.values()));
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load last messages";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadLastMessages();
  }, [memoizedConversationIds]);

  return { data, loading, error };
}
