"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";
import { PerformanceMonitor } from "@/lib/performance-utils";

// Cache for messages to prevent re-fetching
const messageCache = new Map<string, { data: DbMessage[]; timestamp: number }>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes cache

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

  // Check cache first
  const getCachedMessages = useCallback((convId: string): DbMessage[] | null => {
    const cached = messageCache.get(convId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }, []);

  // Cache messages
  const cacheMessages = useCallback((convId: string, messages: DbMessage[]) => {
    messageCache.set(convId, {
      data: messages,
      timestamp: Date.now()
    });
  }, []);

  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      return;
    }

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
          setData([]);
          setLoading(false);
          return;
        }
        
        // Check cache first
        const cachedMessages = getCachedMessages(conversationId);
        if (cachedMessages) {
          setData(cachedMessages);
          setLoading(false);
          console.log("📦 Using cached messages for conversation:", conversationId);
        }
        
        // If agent is not available, don't clear data - keep existing messages
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        // Only fetch if not cached
        if (!cachedMessages) {
          console.log("🔍 Fetching messages from database for conversation:", conversationId);
          
          const messages = await PerformanceMonitor.measureAsync(
            `fetch-messages-${conversationId}`,
            async () => {
              const { data, error } = await client
                .from("messages")
                .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at")
                .eq("conversation_id", conversationId)
                .eq("org_id", agent.org_id)
                .order("created_at", { ascending: true })
                .limit(100); // Limit to 100 most recent messages for faster loading
              
              if (error) {
                throw error;
              }
              
              return data as DbMessage[];
            }
          );
          
          setData(messages);
          cacheMessages(conversationId, messages);
          console.log("✅ Loaded and cached messages:", messages.length);
        }

        // Enable realtime subscription for message syncing (only if not already subscribed)
        if (!unsub) {
          const channel = client
            .channel(`msg_changes_${conversationId}`)
            .on(
              "postgres_changes" as never,
              { event: "insert", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
              (payload: { new: DbMessage }) => {
                console.log("📨 New message via realtime:", payload.new.id);
                setData((prev) => {
                  if (!prev) return [payload.new];
                  
                  // Check for duplicates
                  const exists = prev.some(msg => msg.id === payload.new.id);
                  if (exists) return prev;
                  
                  const updated = [...prev, payload.new];
                  // Update cache
                  cacheMessages(conversationId, updated);
                  return updated;
                });
              }
            )
            .subscribe();
          unsub = () => client.removeChannel(channel);
        }
      } catch (e: unknown) {
        console.error("❌ Error loading messages:", e);
        setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }
    
    load();
    return () => {
      if (unsub) unsub();
    };
  }, [conversationId, agent?.org_id, getCachedMessages, cacheMessages]);

  // Function to clear cache for a specific conversation
  const clearCache = useCallback((convId?: string) => {
    if (convId) {
      messageCache.delete(convId);
    } else {
      messageCache.clear();
    }
  }, []);

  return { data, loading, error, clearCache };
}


