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

        // Additional check: if we have data from localStorage, don't reload
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('linquo-conversations-cache');
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed.lastLoaded && Date.now() - parsed.lastLoaded < 600000 && parsed.conversations?.length > 0) {
                console.log("🚀 Skipping reload - using localStorage cache");
                setData(parsed.conversations);
                setLoading(false);
                setHasLoaded(true);
                // Still set up real-time subscriptions even with cached data
                console.log("🔄 Setting up real-time subscriptions with cached data");
                return;
              }
            }
          } catch (error) {
            console.warn('Failed to check localStorage cache:', error);
          }
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
          
          // Try to fetch customers with retry logic
          let retryCount = 0;
          const maxRetries = 3;
          
          while (retryCount < maxRetries) {
            try {
              const { data: customers, error: customerError } = await client
                .from("customers")
                .select("id,display_name,email")
                .in("id", customerIds);
              
              if (customerError) {
                console.error(`❌ Error fetching customers (attempt ${retryCount + 1}):`, customerError);
                retryCount++;
                if (retryCount < maxRetries) {
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
                  continue;
                }
              } else {
                console.log("✅ Fetched customer data:", customers);
                customerData = customers || [];
                break;
              }
            } catch (err) {
              console.error(`❌ Exception fetching customers (attempt ${retryCount + 1}):`, err);
              retryCount++;
              if (retryCount < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              }
            }
          }
          
          if (customerData.length === 0) {
            console.warn("⚠️ No customer data fetched after all retries, trying individual fetches");
            
            // Try to fetch customers individually as fallback
            for (const customerId of customerIds) {
              try {
                const { data: customer, error } = await client
                  .from("customers")
                  .select("id,display_name,email")
                  .eq("id", customerId)
                  .single();
                
                if (!error && customer) {
                  customerData.push(customer);
                  console.log(`✅ Fetched individual customer:`, customer);
                } else {
                  console.error(`❌ Failed to fetch individual customer ${customerId}:`, error);
                }
              } catch (err) {
                console.error(`❌ Exception fetching individual customer ${customerId}:`, err);
              }
            }
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

        // Set up real-time subscriptions
        console.log("🔄 Setting up real-time subscriptions for new conversations");
        
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

        // Set up realtime subscription for new conversations only (INSERT events)
        const conversationChannel = client
          .channel("conv_changes")
          .on(
            "postgres_changes" as never,
            { event: "INSERT", schema: "public", table: "conversations" },
            (payload) => {
              console.log("🔄 New conversation detected:", payload);
              
              // Only process conversations for the current organization
              if (payload.new.org_id !== agent.org_id) {
                console.log("🔄 Ignoring conversation from different org:", payload.new.org_id);
                return;
              }
              
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
  }, [agent?.org_id, data, hasLoaded]); // Include all dependencies

  // Set up real-time subscriptions separately to ensure they're always active
  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!client || !agent?.org_id) return;

    console.log("🔄 Setting up real-time subscriptions (separate effect)");
    
    // Clear any existing cache to ensure fresh data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('linquo-conversations-cache');
      console.log("🗑️ Cleared localStorage cache for fresh real-time data");
    }
    
    // Set up realtime subscription for messages to update conversation order
    const messageChannel = client
      .channel("message_changes_separate")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          console.log("🔄 New message detected (separate):", payload);
          
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
                
                console.log("📈 Moved conversation to top (separate):", conversation.id);
                
                // Update localStorage cache with the updated conversation order
                if (typeof window !== 'undefined') {
                  try {
                    const cacheData = {
                      conversations: updatedData,
                      lastLoaded: Date.now()
                    };
                    localStorage.setItem('linquo-conversations-cache', JSON.stringify(cacheData));
                    console.log("💾 Updated localStorage with conversation order change");
                  } catch (error) {
                    console.warn('Failed to update localStorage with conversation order:', error);
                  }
                }
                
                return updatedData;
              }
              
              return prevData;
            });
          }
        }
      )
      .subscribe();

    // Set up realtime subscription for conversations (INSERT and UPDATE events)
    const conversationChannel = client
      .channel("conv_changes_separate")
      .on(
        "postgres_changes" as never,
        { event: "INSERT", schema: "public", table: "conversations" },
        (payload) => {
          console.log("🔄 New conversation detected (separate):", payload);
          
          // Only process conversations for the current organization
          if (payload.new.org_id !== agent.org_id) {
            console.log("🔄 Ignoring conversation from different org (separate):", payload.new.org_id);
            return;
          }
          
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
            
            console.log("📈 New conversation added to top (separate):", newConversation.id);
            
            // Update localStorage cache with the new conversation
            if (typeof window !== 'undefined') {
              try {
                const updatedData = [newConversation, ...prevData];
                const cacheData = {
                  conversations: updatedData,
                  lastLoaded: Date.now()
                };
                localStorage.setItem('linquo-conversations-cache', JSON.stringify(cacheData));
                console.log("💾 Updated localStorage with new conversation");
              } catch (error) {
                console.warn('Failed to update localStorage with new conversation:', error);
              }
            }
            
            return [newConversation, ...prevData];
          });
        }
      )
      .on(
        "postgres_changes" as never,
        { event: "UPDATE", schema: "public", table: "conversations" },
        (payload) => {
          console.log("🔄 Conversation updated (separate):", payload);
          
          // Only process conversations for the current organization
          if (payload.new.org_id !== agent.org_id) {
            console.log("🔄 Ignoring conversation update from different org (separate):", payload.new.org_id);
            return;
          }
          
          // Update the conversation in the list
          setData(prevData => {
            if (!prevData) return prevData;
            
            const updatedData = prevData.map(conv => 
              conv.id === payload.new.id ? { ...conv, ...payload.new } : conv
            );
            
            console.log("🔄 Updated conversation in list (separate):", payload.new.id, "State:", payload.new.state);
            
            // Update localStorage cache
            if (typeof window !== 'undefined') {
              try {
                const cacheData = {
                  conversations: updatedData,
                  lastLoaded: Date.now()
                };
                localStorage.setItem('linquo-conversations-cache', JSON.stringify(cacheData));
                console.log("💾 Updated localStorage with conversation update");
              } catch (error) {
                console.warn('Failed to update localStorage with conversation update:', error);
              }
            }
            
            return updatedData;
          });
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(messageChannel);
      client.removeChannel(conversationChannel);
    };
  }, [agent?.org_id]);

  const refresh = useCallback(() => {
    console.log("🔄 Manual refresh triggered");
    setHasLoaded(false);
    setLoading(true);
    // Clear cache to force reload
    if (typeof window !== 'undefined') {
      localStorage.removeItem('linquo-conversations-cache');
    }
  }, []);

  const refreshCustomerData = useCallback(async () => {
    console.log("🔄 Refreshing customer data only");
    if (!data || data.length === 0) return;
    
    const client = getSupabaseBrowser();
    if (!client) return;
    
    const customerIds = data.map(c => c.customer_id).filter(Boolean);
    if (customerIds.length === 0) return;
    
    try {
      const { data: customers, error } = await client
        .from("customers")
        .select("id,display_name,email")
        .in("id", customerIds);
      
      if (!error && customers) {
        console.log("✅ Refreshed customer data:", customers);
        
        // Update the existing data with new customer info
        setData(prevData => {
          if (!prevData) return prevData;
          
          return prevData.map(conv => ({
            ...conv,
            customers: customers.find(c => c.id === conv.customer_id) || conv.customers
          }));
        });
      } else {
        console.error("❌ Failed to refresh customer data:", error);
      }
    } catch (err) {
      console.error("❌ Exception refreshing customer data:", err);
    }
  }, [data]);

  return { data, loading, error, refresh, refreshCustomerData };
}


