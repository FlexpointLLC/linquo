"use client";
import { useEffect, useState, useCallback } from "react";
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const { agent } = useAuth();

  // Load conversations from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('linquo-conversations-cache');
        if (stored) {
          const parsed = JSON.parse(stored);
          // Only use cached data if it's less than 10 minutes old
          if (parsed.lastLoaded && Date.now() - parsed.lastLoaded < 600000) {
            console.log("🚀 Loading from localStorage cache:", parsed.conversations);
            setData(parsed.conversations);
            setLoading(false);
            setHasLoaded(true);
            return; // Don't fetch from server if we have recent cache
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

        // Don't reload if we already have recent data
        if (hasLoaded && data && data.length > 0) {
          console.log("🚀 Skipping reload - already have recent data");
          setLoading(false);
          return;
        }
        
        // First get conversations
        const { data: conversations, error } = await client
          .from("conversations")
          .select("id,customer_id,last_message_at,state,created_at")
          .eq("org_id", agent.org_id)
          .order("last_message_at", { ascending: false, nullsFirst: false })
          .limit(30); // Limit to 30 most recent conversations for faster loading
        
        if (error) {
          throw error;
        }
        
        // Then get customer data for all conversations
        const customerIds = conversations?.map(c => c.customer_id).filter(Boolean) || [];
        let customerData: { id: string; display_name: string; email: string }[] = [];
        
        if (customerIds.length > 0) {
          console.log("🔍 Fetching customer data for IDs:", customerIds);
          const { data: customers, error: customerError } = await client
            .from("customers")
            .select("id,display_name,email")
            .in("id", customerIds);
          
          if (customerError) {
            console.error("❌ Error fetching customers:", customerError);
          } else {
            console.log("✅ Fetched customer data:", customers);
            customerData = customers || [];
          }
        } else {
          console.log("⚠️ No customer IDs found in conversations");
        }
        
        // Combine the data
        const combinedData = conversations?.map(conv => ({
          ...conv,
          customers: customerData.find(c => c.id === conv.customer_id) || null
        })) || [];
        // Set data even if it's an empty array (no conversations)
        const conversationData = combinedData as Conversation[] || [];
        
        // Sort by last_message_at to ensure proper order
        conversationData.sort((a, b) => {
          const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
          const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
          return bTime - aTime; // Most recent first
        });
        console.log("🔍 Conversations with customer data:", conversationData.map(c => ({
          id: c.id,
          customer_id: c.customer_id,
          customer_name: c.customers?.display_name,
          customer_email: c.customers?.email,
          has_customer_data: !!c.customers
        })));
        console.log("🔍 Customer data array:", customerData);
        console.log("🔍 Customer IDs from conversations:", customerIds);
        console.log("🔍 Raw conversations from DB:", conversations);
        setData(conversationData);
        setHasLoaded(true);
        
        // Save to localStorage for persistence
        if (typeof window !== 'undefined') {
          try {
            const cacheData = {
              conversations: conversationData, // Save the processed data with customer info
              lastLoaded: Date.now()
            };
            localStorage.setItem('linquo-conversations-cache', JSON.stringify(cacheData));
            console.log("💾 Saved to localStorage:", cacheData);
          } catch (error) {
            console.warn('Failed to save conversations to localStorage:', error);
          }
        }

        // Set up realtime subscription for messages to update conversation order
        const messageChannel = client
          .channel("message_changes")
          .on(
            "postgres_changes" as never,
            { event: "INSERT", schema: "public", table: "messages" },
            (payload) => {
              console.log("🔄 New message detected:", payload);
              
              // Update the conversation's last_message_at timestamp
              if (payload.new && payload.new.conversation_id) {
                setData(prevData => {
                  if (!prevData) return prevData;
                  
                  // Find the conversation and move it to the top
                  const updatedData = [...prevData];
                  const conversationIndex = updatedData.findIndex(
                    conv => conv.id === payload.new.conversation_id
                  );
                  
                  if (conversationIndex !== -1) {
                    // Move conversation to top and update timestamp
                    const conversation = updatedData[conversationIndex];
                    conversation.last_message_at = payload.new.created_at;
                    updatedData.splice(conversationIndex, 1);
                    updatedData.unshift(conversation);
                    
                    console.log("📈 Moved conversation to top:", conversation.id);
                    return updatedData;
                  }
                  
                  return prevData;
                });
              }
            }
          )
          .subscribe();

        // Set up realtime subscription for conversation updates
        const conversationChannel = client
          .channel("conv_changes")
          .on(
            "postgres_changes" as never,
            { event: "*", schema: "public", table: "conversations" },
            (payload) => {
              console.log("🔄 Conversation change detected:", payload);
              
              if (payload.eventType === "INSERT") {
                // New conversation created - add to top of list
                setData(prevData => {
                  if (!prevData) return prevData;
                  
                  const newConversation = {
                    id: payload.new.id,
                    customer_id: payload.new.customer_id,
                    last_message_at: payload.new.last_message_at,
                    state: payload.new.state,
                    created_at: payload.new.created_at,
                    customers: null // Will be populated when customer data is fetched
                  };
                  
                  // Fetch customer data for the new conversation
                  if (payload.new.customer_id) {
                    client
                      .from("customers")
                      .select("id,display_name,email")
                      .eq("id", payload.new.customer_id)
                      .single()
                      .then(({ data: customerData }) => {
                        if (customerData) {
                          setData(prevData => {
                            if (!prevData) return prevData;
                            return prevData.map(conv => 
                              conv.id === payload.new.id 
                                ? { ...conv, customers: customerData }
                                : conv
                            );
                          });
                        }
                      });
                  }
                  
                  console.log("📈 New conversation added to top:", newConversation.id);
                  return [newConversation, ...prevData];
                });
              } else if (payload.eventType === "UPDATE") {
                // Conversation updated - refresh the list
                setData(prevData => {
                  if (!prevData) return prevData;
                  
                  return prevData.map(conv => 
                    conv.id === payload.new.id 
                      ? { ...conv, ...payload.new }
                      : conv
                  );
                });
              }
            }
          )
          .subscribe();

        unsub = () => {
          client.removeChannel(messageChannel);
          client.removeChannel(conversationChannel);
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
  }, [agent?.org_id, hasLoaded]); // Only depend on org_id and hasLoaded, not data

  const refresh = useCallback(() => {
    setHasLoaded(false);
    setLoading(true);
    // Clear cache to force reload
    if (typeof window !== 'undefined') {
      localStorage.removeItem('linquo-conversations-cache');
    }
  }, []);

  return { data, loading, error, refresh };
}


