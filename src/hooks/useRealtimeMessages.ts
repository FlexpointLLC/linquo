"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { realtimeService, type RealtimeMessage } from "@/lib/realtime";

export type DbMessage = {
  id: string;
  conversation_id: string;
  sender_type: "AGENT" | "CUSTOMER";
  agent_id: string | null;
  customer_id: string | null;
  body_text: string;
  created_at: string;
};

export function useRealtimeMessages(conversationId: string | null) {
  const [data, setData] = useState<DbMessage[] | null>(null);
  const [loading, setLoading] = useState(Boolean(conversationId));
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Load initial messages with debouncing
  useEffect(() => {
    const client = getSupabaseBrowser();
    if (!conversationId || !client) {
      setData([]);
      setLoading(false);
      return;
    }

    // Debounce message loading to prevent rapid requests
    const timeoutId = setTimeout(async () => {
      try {
        console.log("🔍 Loading initial messages for conversation:", conversationId);
        
        if (!client) {
          throw new Error("Supabase client not available");
        }
        
        const { data: messages, error } = await client
          .from("messages")
          .select("id,conversation_id,sender_type,agent_id,customer_id,body_text,created_at")
          .eq("conversation_id", conversationId)
          .order("created_at", { ascending: true })
          .limit(50); // Limit to 50 most recent messages for faster loading
        
        if (error) {
          console.error("❌ Error loading initial messages:", error);
          throw error;
        }
        
        console.log("✅ Loaded initial messages:", messages?.length || 0);
        setData(messages as DbMessage[]);
      } catch (e) {
        console.error("❌ Failed to load initial messages:", e);
        setError(e instanceof Error ? e.message : "Failed to load messages");
      } finally {
        setLoading(false);
      }
    }, 100); // 100ms debounce

    return () => clearTimeout(timeoutId);
  }, [conversationId]);

  // Set up realtime connection with fallback (client-side only)
  useEffect(() => {
    // Ensure we're on the client side
    if (typeof window === 'undefined') {
      return;
    }

    if (!conversationId) {
      return;
    }

    console.log("🔌 Setting up realtime connection for conversation:", conversationId);

    const handleNewMessage = (message: RealtimeMessage) => {
      console.log("📨 New realtime message received:", message);
      setData(prev => {
        if (!prev) return [message as DbMessage];
        
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => msg.id === message.id);
        if (exists) {
          console.log("⚠️ Duplicate message detected, ignoring");
          return prev;
        }
        
        // Add new message and sort by created_at
        const updated = [...prev, message as DbMessage];
        return updated.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      });
    };

    const handleConnectionChange = (connected: boolean) => {
      console.log("🔌 Realtime connection status changed:", connected);
      setIsConnected(connected);
    };

    // Set up fallback Postgres Changes subscription
    const client = getSupabaseBrowser();
    let fallbackUnsub: (() => void) | undefined;

    if (client) {
      console.log("🔄 Setting up fallback Postgres Changes subscription");
      const fallbackChannel = client
        .channel(`fallback_${conversationId}`)
        .on(
          "postgres_changes" as never,
          { 
            event: "insert", 
            schema: "public", 
            table: "messages", 
            filter: `conversation_id=eq.${conversationId}` 
          },
          (payload: { new: DbMessage }) => {
            console.log("📨 Fallback message received:", payload.new);
            setData(prev => {
              if (!prev) return [payload.new];
              
              const exists = prev.some(msg => msg.id === payload.new.id);
              if (exists) return prev;
              
              const updated = [...prev, payload.new];
              return updated.sort((a, b) => 
                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
            });
          }
        )
        .subscribe();
      
      fallbackUnsub = () => client.removeChannel(fallbackChannel);
    }

    try {
      realtimeService.createConversationChannel(
        conversationId,
        handleNewMessage,
        handleConnectionChange
      );

      return () => {
        console.log("🧹 Cleaning up realtime connection for conversation:", conversationId);
        realtimeService.removeChannel(conversationId);
        if (fallbackUnsub) {
          fallbackUnsub();
        }
      };
    } catch (error) {
      console.error("❌ Failed to create realtime connection:", error);
      setError("Failed to establish realtime connection");
    }
  }, [conversationId]);

  // Send message function
  const sendMessage = useCallback(async (
    messageData: Omit<DbMessage, 'id' | 'created_at'>
  ) => {
    if (!conversationId) {
      throw new Error("No conversation ID available");
    }

    try {
      // First, save to database
      const client = getSupabaseBrowser();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      const { data: savedMessage, error: dbError } = await client
        .from("messages")
        .insert([messageData])
        .select()
        .single();

      if (dbError) {
        console.error("❌ Failed to save message to database:", dbError);
        throw dbError;
      }

      console.log("✅ Message saved to database:", savedMessage);

      // Then broadcast via realtime
      await realtimeService.sendMessage(conversationId, savedMessage as RealtimeMessage);
      
      return savedMessage;
    } catch (error) {
      console.error("❌ Failed to send message:", error);
      throw error;
    }
  }, [conversationId]);

  // Send typing indicator
  const sendTypingIndicator = useCallback(async (
    isTyping: boolean,
    userId: string,
    userType: 'AGENT' | 'CUSTOMER'
  ) => {
    if (!conversationId) return;
    
    try {
      await realtimeService.sendTypingIndicator(conversationId, isTyping, userId, userType);
    } catch (error) {
      console.error("❌ Failed to send typing indicator:", error);
    }
  }, [conversationId]);

  return { 
    data, 
    loading, 
    error, 
    isConnected,
    sendMessage,
    sendTypingIndicator
  };
}
