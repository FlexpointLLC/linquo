"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

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
  const { agent } = useAuth();

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('linquo-conversations-cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only use cached data if it's less than 2 minutes old
          if (parsed.lastLoaded && Date.now() - parsed.lastLoaded < 120000) {
            setData(parsed.conversations);
            setLoading(false);
          }
        }
      } catch (error) {
        console.warn('Failed to load conversations from localStorage:', error);
      }
    }
  }, []);

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
        
        // If agent is not available, don't clear data - keep existing conversations
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await client
          .from("conversations")
          .select("id,customer_id,last_message_at")
          .eq("org_id", agent.org_id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(100);
        
        if (error) {
          throw error;
        }
        // Set data even if it's an empty array (no conversations)
        const conversations = data as Conversation[] || [];
        setData(conversations);
        
        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('linquo-conversations-cache', JSON.stringify({
              conversations,
              lastLoaded: Date.now()
            }));
          } catch (error) {
            console.warn('Failed to save conversations to localStorage:', error);
          }
        }

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
  }, [agent?.org_id]);

  return { data, loading, error };
}


