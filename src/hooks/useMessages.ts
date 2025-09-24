"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PerformanceMonitor } from "@/lib/performance-utils";

// Enhanced cache with LRU and pagination support
type CacheEntry = {
  pages: Map<number, DbMessage[]>;
  lastUpdated: number;
  totalCount: number;
};

const messageCache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache
const PAGE_SIZE = 50; // Messages per page
const MAX_CACHED_PAGES = 10; // Maximum number of cached pages per conversation

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
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const { agent } = useAuth();

  // Audio context for notifications
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canPlayRef = useRef<boolean>(false);
  const notifyEnabledRef = useRef<boolean>(false);
  const loadingRef = useRef(false);

  // Initialize audio context
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

  // Notification sound
  const playNotificationSound = useCallback(async () => {
    if (!canPlayRef.current || !audioCtxRef.current) return;
    
    try {
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.01);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {
      // ignore
    }
  }, []);

  // Load messages for a specific page
  const loadPage = useCallback(async (page: number) => {
    if (!conversationId || !agent?.org_id || loadingRef.current) return;
    
    loadingRef.current = true;
    const client = createClient();
    if (!client) return;

    try {
      // Check cache first
      const cached = messageCache.get(conversationId);
      const cachedPage = cached?.pages.get(page);
      
      if (cachedPage && Date.now() - cached.lastUpdated < CACHE_DURATION) {
        setMessages(prev => {
          const newMessages = [...prev];
          cachedPage.forEach(msg => {
            const index = newMessages.findIndex(m => m.id === msg.id);
            if (index === -1) {
              newMessages.push(msg);
            }
          });
          return newMessages.sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });
        setHasMore(page * PAGE_SIZE < (cached.totalCount || 0));
        loadingRef.current = false;
        return;
      }

      // Fetch from database
      console.log(`🔍 Fetching page ${page} for conversation:`, conversationId);
      
      const offset = (page - 1) * PAGE_SIZE;
      const { data: pageData, error: pageError, count } = await client
        .from("messages")
        .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at,read_by_agent,read_at", { count: 'exact' })
        .eq("conversation_id", conversationId)
        .eq("org_id", agent.org_id)
        .order("created_at", { ascending: true })
        .range(offset, offset + PAGE_SIZE - 1);

      if (pageError) throw pageError;

      const messages = (pageData as DbMessage[]).map(msg => ({
        ...msg,
        read_by_agent: msg.read_by_agent ?? false,
        read_at: msg.read_at ?? null
      }));

      // Update cache
      if (!cached) {
        messageCache.set(conversationId, {
          pages: new Map([[page, messages]]),
          lastUpdated: Date.now(),
          totalCount: count || 0
        });
      } else {
        cached.pages.set(page, messages);
        cached.lastUpdated = Date.now();
        cached.totalCount = count || 0;

        // Limit cache size
        if (cached.pages.size > MAX_CACHED_PAGES) {
          const oldestPage = Math.min(...cached.pages.keys());
          cached.pages.delete(oldestPage);
        }
      }

      setMessages(prev => {
        const newMessages = [...prev];
        messages.forEach(msg => {
          const index = newMessages.findIndex(m => m.id === msg.id);
          if (index === -1) {
            newMessages.push(msg);
          }
        });
        return newMessages.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
      setHasMore(Boolean(count && offset + PAGE_SIZE < count));

    } catch (error) {
      console.error("Error loading messages:", error);
      setError(error instanceof Error ? error.message : "Failed to load messages");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [conversationId, agent?.org_id]);

  // Load initial page
  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      setCurrentPage(1);
      setHasMore(true);
      loadPage(1);
    }
  }, [conversationId, loadPage]);

  // Load more messages
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      setCurrentPage(prev => prev + 1);
      loadPage(currentPage + 1);
    }
  }, [loading, hasMore, currentPage, loadPage]);

  // Real-time updates
  useEffect(() => {
    if (!conversationId || !agent?.org_id) return;

    const client = createClient();
    if (!client) return;

    // Subscribe to new messages
    const subscription = client
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async payload => {
        const newMessage = payload.new as DbMessage;
        
        // Play notification for new messages from others
        if (newMessage.sender_type === 'CUSTOMER') {
          await playNotificationSound();
        }

        setMessages(prev => {
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          return [...prev, newMessage].sort((a, b) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

        // Update cache
        const cached = messageCache.get(conversationId);
        if (cached) {
          cached.totalCount = (cached.totalCount || 0) + 1;
          cached.lastUpdated = Date.now();
          
          // Add to latest page
          const latestPage = Math.max(...cached.pages.keys());
          const pageMessages = cached.pages.get(latestPage) || [];
          if (pageMessages.length < PAGE_SIZE) {
            cached.pages.set(latestPage, [...pageMessages, newMessage]);
          }
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [conversationId, agent?.org_id, playNotificationSound]);

  // Mark messages as read
  const markMessagesAsRead = useCallback(async () => {
    if (!conversationId || !agent?.org_id || !messages.length) return;

    const client = createClient();
    if (!client) return;

    const unreadMessages = messages.filter(msg => 
      !msg.read_by_agent && msg.sender_type === 'CUSTOMER'
    );

    if (!unreadMessages.length) return;

    try {
      const { error } = await client
        .from("messages")
        .update({
          read_by_agent: true,
          read_at: new Date().toISOString()
        })
        .in('id', unreadMessages.map(msg => msg.id));

      if (error) throw error;

      // Update local state and cache
      setMessages(prev => 
        prev.map(msg => 
          unreadMessages.some(u => u.id === msg.id)
            ? { ...msg, read_by_agent: true, read_at: new Date().toISOString() }
            : msg
        )
      );

      const cached = messageCache.get(conversationId);
      if (cached) {
        cached.pages.forEach((pageMessages, pageNum) => {
          cached.pages.set(
            pageNum,
            pageMessages.map(msg =>
              unreadMessages.some(u => u.id === msg.id)
                ? { ...msg, read_by_agent: true, read_at: new Date().toISOString() }
                : msg
            )
          );
        });
      }

    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }, [conversationId, agent?.org_id, messages]);

  // Refresh messages
  const refresh = useCallback(() => {
    if (!conversationId) return;
    
    // Clear cache for this conversation
    messageCache.delete(conversationId);
    
    // Reset state and reload
    setMessages([]);
    setCurrentPage(1);
    setHasMore(true);
    loadPage(1);
  }, [conversationId, loadPage]);

  return {
    data: messages,
    loading,
    error,
    hasMore,
    loadMore,
    markMessagesAsRead,
    refresh,
    playNotificationSound
  };
}