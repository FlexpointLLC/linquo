"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type Conversation = {
  id: string;
  title?: string;
  customer_id: string;
  last_message_at: string | null;
  state?: "OPEN" | "CLOSED";
  created_at?: string;
  customers: {
    id: string;
    display_name: string;
    email: string;
  } | null;
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
        
        // First get conversations
        const { data: conversations, error } = await client
          .from("conversations")
          .select("id,customer_id,last_message_at,state,created_at")
          .eq("org_id", agent.org_id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(50); // Limit to 50 most recent conversations for faster loading
        
        if (error) {
          throw error;
        }
        
        // Then get customer data for all conversations
        const customerIds = conversations?.map(c => c.customer_id).filter(Boolean) || [];
        let customerData: { id: string; display_name: string; email: string }[] = [];
        
        if (customerIds.length > 0) {
          const { data: customers, error: customerError } = await client
            .from("customers")
            .select("id,display_name,email")
            .in("id", customerIds);
          
          if (customerError) {
            console.error("Error fetching customers:", customerError);
          } else {
            customerData = customers || [];
          }
        }
        
        // Combine the data
        const data = conversations?.map(conv => ({
          ...conv,
          customers: customerData.find(c => c.id === conv.customer_id) || null
        })) || [];
        // Set data even if it's an empty array (no conversations)
        const conversationData = data as Conversation[] || [];
        console.log("🔍 Conversations with customer data:", conversationData.map(c => ({
          id: c.id,
          customer_id: c.customer_id,
          customer_name: c.customers?.display_name,
          customer_email: c.customers?.email
        })));
        setData(conversationData);
        
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

        // Enable realtime subscription for conversation updates
        const channel = client
          .channel("conv_changes")
          .on(
            "postgres_changes" as never,
            { event: "*", schema: "public", table: "conversations" },
            () => {
              // Reload list on any change
              client
                .from("conversations")
                .select("id,customer_id,last_message_at,state,created_at")
                .eq("org_id", agent.org_id)
                .order("last_message_at", { ascending: false, nullsFirst: false })
                .limit(100)
                .then(async ({ data: conversations }) => {
                  if (!conversations) {
                    setData([]);
                    return;
                  }
                  
                  // Get customer data for all conversations
                  const customerIds = conversations.map(c => c.customer_id).filter(Boolean);
                  let customerData: { id: string; display_name: string; email: string }[] = [];
                  
                  if (customerIds.length > 0) {
                    const { data: customers } = await client
                      .from("customers")
                      .select("id,display_name,email")
                      .in("id", customerIds);
                    
                    customerData = customers || [];
                  }
                  
                  // Combine the data
                  const combinedData = conversations.map(conv => ({
                    ...conv,
                    customers: customerData.find(c => c.id === conv.customer_id) || null
                  })) as Conversation[];
                  
                  setData(combinedData);
                  
                  // Update localStorage cache
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
                });
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
  }, [agent?.org_id]);

  return { data, loading, error };
}


