"use client";
import { useEffect, useState, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type LastMessage = {
  conversation_id: string;
  body_text: string;
  created_at: string;
};

export function useLastMessages(conversationIds: string[]) {
  const [data, setData] = useState<LastMessage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuth();

  // Memoize the conversationIds to prevent infinite loops
  const memoizedConversationIds = useMemo(() => conversationIds, [conversationIds]);

  useEffect(() => {
    if (!memoizedConversationIds.length) {
      setData([]);
      setLoading(false);
      return;
    }

    const client = createClient();
    if (!client) {
      setError("Supabase client not available");
      setLoading(false);
      return;
    }

    let messageChannel: ReturnType<typeof client.channel> | null = null;

    async function loadLastMessages() {
      try {
        setLoading(true);
        setError(null);

        // Get the last message for each conversation
        if (!client) {
          setError("Supabase client not available");
          return;
        }
        
        // If agent is not available, don't clear data - keep existing last messages
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data: messages, error } = await client
          .from("messages")
          .select("conversation_id, body_text, created_at")
          .in("conversation_id", memoizedConversationIds)
          .eq("org_id", agent.org_id)
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

        // Set up real-time subscription for new messages to update last messages
        messageChannel = client
          .channel("last_message_changes")
          .on(
            "postgres_changes" as never,
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => {
              // Only process messages for conversations we're tracking
              if (payload.new && memoizedConversationIds.includes(payload.new.conversation_id)) {
                setData(prevData => {
                  if (!prevData) return prevData;
                  
                  // Update or add the last message for this conversation
                  const updatedData = [...prevData];
                  const existingIndex = updatedData.findIndex(
                    msg => msg.conversation_id === payload.new.conversation_id
                  );
                  
                  const newLastMessage = {
                    conversation_id: payload.new.conversation_id,
                    body_text: payload.new.body_text,
                    created_at: payload.new.created_at
                  };
                  
                  if (existingIndex !== -1) {
                    // Update existing last message
                    updatedData[existingIndex] = newLastMessage;
                  } else {
                    // Add new last message
                    updatedData.push(newLastMessage);
                  }
                  
                  return updatedData;
                });
              }
            }
          )
          .subscribe();

      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : "Failed to load last messages";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadLastMessages();
    
    // Return cleanup function
    return () => {
      if (messageChannel) {
        client.removeChannel(messageChannel);
      }
    };
  }, [memoizedConversationIds, agent?.org_id]);

  return { data, loading, error };
}
