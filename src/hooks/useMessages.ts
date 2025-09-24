"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
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
  read_by_agent?: boolean;
  read_at?: string | null;
};

export function useMessages(conversationId: string | null) {
  const [data, setData] = useState<DbMessage[] | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const { agent } = useAuth();

  // Single AudioContext reused (initialized on user gesture to satisfy autoplay policies)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canPlayRef = useRef<boolean>(false);
  const notifyEnabledRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const init = async () => {
      try {
        const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AC();
        }
        if (audioCtxRef.current.state === 'suspended') {
          await audioCtxRef.current.resume();
        }
        canPlayRef.current = true;
      } catch {
        // ignore
      }
    };

    const onInteract = async () => {
      await init();
      try {
        if ('Notification' in window) {
          const perm = await Notification.requestPermission();
          notifyEnabledRef.current = perm === 'granted';
        }
      } catch {}
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteract as EventListener);
      window.removeEventListener('keydown', onInteract as EventListener);
    };
  }, []);

  // Lightweight notification sound using Web Audio API
  const playNotificationSound = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) {
        // Only create if we already have user interaction
        if (!canPlayRef.current) return;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200; // brighter beep
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.27);
    } catch {
      // ignore
    }
  }, []);

  const showSystemNotification = useCallback((messagePreview?: string) => {
    try {
      if (!('Notification' in window)) return;
      if (!notifyEnabledRef.current) return;
      const title = 'New message';
      const body = (messagePreview || '').slice(0, 120);
      new Notification(title, { body });
    } catch {}
  }, []);

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

    const client = createClient();
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
                .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at,read_by_agent,read_at")
                .eq("conversation_id", conversationId)
                .eq("org_id", agent.org_id)
                .order("created_at", { ascending: true })
                .limit(100); // Limit to 100 most recent messages for faster loading
              
              if (error) {
                throw error;
              }
              
              // Add default values for read status fields if they don't exist
              return (data as DbMessage[]).map(msg => ({
                ...msg,
                read_by_agent: msg.read_by_agent ?? false,
                read_at: msg.read_at ?? null
              }));
            }
          );
          
          setData(messages);
          setLastMessageCount(messages.length);
          cacheMessages(conversationId, messages);
          console.log("✅ Loaded and cached messages:", messages.length);
        }

        // Enable realtime subscription for message syncing (only if not already subscribed)
        if (!unsub) {
          console.log("🔄 Setting up real-time subscription for conversation:", conversationId);
          
          const channel = client
            .channel(`msg_changes_${conversationId}_${Date.now()}`) // Add timestamp to ensure unique channel
            .on(
              "postgres_changes" as never,
              { event: "insert", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
              (payload: { new: DbMessage }) => {
                console.log("📨 New message via realtime:", payload.new.id, "Sender:", payload.new.sender_type);
                
                // Add default values for read status fields
                const newMessage = {
                  ...payload.new,
                  read_by_agent: payload.new.read_by_agent ?? false,
                  read_at: payload.new.read_at ?? null
                };
                
                // Play sound only for incoming customer messages
                if (newMessage.sender_type === "CUSTOMER") {
                  playNotificationSound();
                  showSystemNotification(newMessage.body_text);
                }

                setData((prev) => {
                  if (!prev) return [newMessage];
                  
                  // Check for duplicates
                  const exists = prev.some(msg => msg.id === newMessage.id);
                  if (exists) {
                    console.log("⚠️ Duplicate message detected, skipping:", newMessage.id);
                    return prev;
                  }
                  
                  const updated = [...prev, newMessage];
                  // Update cache
                  cacheMessages(conversationId, updated);
                  setLastMessageCount(updated.length);
                  console.log("✅ Message added to state, total messages:", updated.length);
                  return updated;
                });
              }
            )
            .on(
              "postgres_changes" as never,
              { event: "update", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
              (payload: { new: DbMessage }) => {
                console.log("📝 Message updated via realtime:", payload.new.id, "Read by agent:", payload.new.read_by_agent);
                
                setData((prev) => {
                  if (!prev) return prev;
                  
                  const updated = prev.map(msg => 
                    msg.id === payload.new.id 
                      ? { ...msg, read_by_agent: payload.new.read_by_agent ?? false, read_at: payload.new.read_at ?? null }
                      : msg
                  );
                  
                  // Update cache
                  cacheMessages(conversationId, updated);
                  console.log("✅ Message read status updated in state");
                  return updated;
                });
              }
            )
            .subscribe((status) => {
              console.log("🔌 Message subscription status:", status, "for conversation:", conversationId);
              if (status === 'SUBSCRIBED') {
                console.log("✅ Message subscription active for conversation:", conversationId);
              } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                console.log("❌ Message subscription error for conversation:", conversationId, "Status:", status);
              }
            });
          unsub = () => {
            console.log("🧹 Cleaning up message subscription for conversation:", conversationId);
            client.removeChannel(channel);
          };
        }

        // Fallback polling mechanism - check for new messages every 5 seconds
        const pollInterval = setInterval(async () => {
          if (!conversationId || !agent?.org_id) return;
          
          try {
            const { data: latestMessages, error } = await client
              .from("messages")
              .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at,read_by_agent,read_at")
              .eq("conversation_id", conversationId)
              .eq("org_id", agent.org_id)
              .order("created_at", { ascending: true })
              .limit(100);
            
            if (error) {
              console.log("⚠️ Polling error:", error);
              return;
            }
            
            // Determine current cached length to detect new arrivals regardless of stale closures
            const cachedLen = (messageCache.get(conversationId)?.data?.length) ?? 0;
            const hasLenIncrease = latestMessages && latestMessages.length > cachedLen;
            if (latestMessages && (hasLenIncrease || latestMessages.some(msg => msg.read_by_agent !== data?.find(d => d.id === msg.id)?.read_by_agent))) {
              console.log("🔄 Polling detected changes:", latestMessages.length - lastMessageCount, "new messages or read status changes");

              // If there are new messages, and any of the new ones are from customer, play sound
              if (hasLenIncrease) {
                const delta = latestMessages.length - cachedLen;
                const newSlice = latestMessages.slice(-Math.max(0, delta));
                const anyCustomer = newSlice.find(m => m.sender_type === 'CUSTOMER');
                if (anyCustomer) {
                  playNotificationSound();
                  showSystemNotification(anyCustomer.body_text);
                }
              }
              const messagesWithDefaults = latestMessages.map(msg => ({
                ...msg,
                read_by_agent: msg.read_by_agent ?? false,
                read_at: msg.read_at ?? null
              }));
              setData(messagesWithDefaults);
              setLastMessageCount(messagesWithDefaults.length);
              cacheMessages(conversationId, messagesWithDefaults);
            }
          } catch (pollError) {
            console.log("⚠️ Polling error:", pollError);
          }
        }, 5000); // Poll every 5 seconds

        // Clean up polling on unmount
        const originalUnsub = unsub;
        unsub = () => {
          if (originalUnsub) originalUnsub();
          clearInterval(pollInterval);
        };
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

  // Function to mark messages as read
  const markMessagesAsRead = useCallback(async (messageIds: string[]) => {
    if (!conversationId || !agent?.id || messageIds.length === 0) return;

    try {
      const client = createClient();
      if (!client) return;

      // Get customer ID from the first message
      const firstMessage = data?.find(m => messageIds.includes(m.id));
      const customerId = firstMessage?.customer_id;
      
      if (!customerId) {
        console.error("❌ No customer ID found for messages");
        return;
      }

      // Mark messages as read (only if read_by_agent column exists)
      let messageError = null;
      try {
        const { error } = await client
          .from("messages")
          .update({ 
            read_by_agent: true, 
            read_at: new Date().toISOString() 
          })
          .in("id", messageIds)
          .eq("conversation_id", conversationId)
          .eq("sender_type", "CUSTOMER"); // Only mark customer messages as read
        
        messageError = error;
      } catch {
        console.log("⚠️ Read status columns may not exist yet, skipping message read status update");
        messageError = null; // Don't treat this as an error
      }

      if (messageError) {
        console.error("❌ Error marking messages as read:", messageError);
        return;
      }

      // Update customer's unread count
      console.log("🔄 Updating customer unread count to 0 for customer:", customerId);
      const { error: customerError } = await client
        .from("customers")
        .update({ 
          unread_count_agent: 0 // Reset to 0 since all messages are now read
        })
        .eq("id", customerId)
        .eq("org_id", agent.org_id);

      if (customerError) {
        console.error("❌ Error updating customer unread count:", customerError);
      } else {
        console.log("✅ Successfully updated customer unread count to 0");
      }

      // Update local state
      setData(prev => {
        if (!prev) return prev;
        return prev.map(msg => 
          messageIds.includes(msg.id) && msg.sender_type === "CUSTOMER"
            ? { ...msg, read_by_agent: true, read_at: new Date().toISOString() }
            : msg
        );
      });

      // Update cache
      const cached = messageCache.get(conversationId);
      if (cached) {
        const updatedMessages = cached.data.map(msg => 
          messageIds.includes(msg.id) && msg.sender_type === "CUSTOMER"
            ? { ...msg, read_by_agent: true, read_at: new Date().toISOString() }
            : msg
        );
        messageCache.set(conversationId, { ...cached, data: updatedMessages });
      }

      console.log("✅ Marked messages as read and updated customer unread count:", messageIds.length);
      
      // Clear cache to ensure fresh data is fetched
      clearCache(conversationId);
    } catch (error) {
      console.error("❌ Failed to mark messages as read:", error);
    }
  }, [conversationId, agent?.id, agent?.org_id, data, clearCache]);

  // Function to force refresh messages (bypass cache)
  const refreshMessages = useCallback(async () => {
    if (!conversationId || !agent?.org_id) return;
    
    try {
      console.log("🔄 Force refreshing messages for conversation:", conversationId);
      clearCache(conversationId);
      
      const client = createClient();
      const { data: messages, error } = await client
        .from("messages")
        .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at,read_by_agent,read_at")
        .eq("conversation_id", conversationId)
        .eq("org_id", agent.org_id)
        .order("created_at", { ascending: true })
        .limit(100);
      
      if (error) {
        console.error("❌ Error refreshing messages:", error);
        return;
      }
      
      const messagesWithDefaults = (messages as DbMessage[]).map(msg => ({
        ...msg,
        read_by_agent: msg.read_by_agent ?? false,
        read_at: msg.read_at ?? null
      }));
      
      setData(messagesWithDefaults);
      setLastMessageCount(messagesWithDefaults.length);
      cacheMessages(conversationId, messagesWithDefaults);
      console.log("✅ Messages refreshed:", messagesWithDefaults.length);
    } catch (error) {
      console.error("❌ Failed to refresh messages:", error);
    }
  }, [conversationId, agent?.org_id, clearCache, cacheMessages]);

  return { data, loading, error, clearCache, markMessagesAsRead, refreshMessages };
}


