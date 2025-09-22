"use client";

import { getSupabaseBrowser } from "./supabase-browser";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface RealtimeMessage {
  id: string;
  conversation_id: string;
  sender_type: "AGENT" | "CUSTOMER";
  agent_id?: string;
  customer_id?: string;
  body_text: string;
  created_at: string;
}

export interface RealtimeConnection {
  channel: RealtimeChannel;
  isConnected: boolean;
  isReconnecting: boolean;
  reconnect: () => void;
  disconnect: () => void;
}

class RealtimeService {
  private channels: Map<string, RealtimeConnection> = new Map();
  private supabase = getSupabaseBrowser();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;

  /**
   * Create a realtime channel for a conversation
   */
  createConversationChannel(
    conversationId: string,
    onMessage: (message: RealtimeMessage) => void,
    onConnectionChange?: (isConnected: boolean) => void
  ): RealtimeConnection {
    // Use more specific channel name to avoid conflicts
    const channelName = `linquo:conversation:${conversationId}:messages`;
    
    // Remove existing channel if it exists
    this.removeChannel(conversationId);

    const channel = this.supabase?.channel(channelName, {
      config: { private: false } // Use public channels for now to avoid RLS issues
    });

    if (!channel) {
      throw new Error("Failed to create Supabase channel");
    }

    // Listen for new messages
    channel
      .on('broadcast', { event: 'new_message' }, (payload) => {
        console.log('📨 Realtime message received:', payload);
        onMessage(payload.payload as RealtimeMessage);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        console.log('⌨️ Typing indicator:', payload);
        // Handle typing indicators if needed
      })
      .subscribe((status) => {
        console.log('🔌 Realtime channel status:', status, 'for conversation:', conversationId);
        const isConnected = status === 'SUBSCRIBED';
        onConnectionChange?.(isConnected);
        
        // Update connection status in the map
        const connection = this.channels.get(conversationId);
        if (connection) {
          connection.isConnected = isConnected;
          connection.isReconnecting = false;
          
          // Reset reconnection attempts on successful connection
          if (isConnected) {
            this.reconnectAttempts.delete(conversationId);
            console.log('✅ Connection restored for conversation:', conversationId);
          }
        }
        
        // Auto-reconnect on disconnection
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.log('🔄 Realtime connection lost, attempting to reconnect...');
          this.attemptReconnect(conversationId);
        }
      });

    const connection: RealtimeConnection = {
      channel,
      isConnected: false,
      isReconnecting: false,
      reconnect: () => this.reconnectChannel(conversationId),
      disconnect: () => this.removeChannel(conversationId)
    };

    this.channels.set(conversationId, connection);
    return connection;
  }

  /**
   * Send a message via realtime broadcast
   */
  async sendMessage(
    conversationId: string,
    message: Omit<RealtimeMessage, 'id' | 'created_at'>
  ): Promise<void> {
    const channelName = `linquo:conversation:${conversationId}:messages`;
    const channel = this.supabase?.channel(channelName);
    
    if (!channel) {
      throw new Error("Failed to get channel for sending message");
    }

    const messageWithMetadata: RealtimeMessage = {
      ...message,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    const response = await channel.send({
      type: 'broadcast',
      event: 'new_message',
      payload: messageWithMetadata
    });

    if (response !== 'ok') {
      console.error('❌ Failed to send realtime message:', response);
      throw new Error('Failed to send realtime message');
    }

    console.log('✅ Realtime message sent:', messageWithMetadata);
  }

  /**
   * Send typing indicator
   */
  async sendTypingIndicator(
    conversationId: string,
    isTyping: boolean,
    userId: string,
    userType: 'AGENT' | 'CUSTOMER'
  ): Promise<void> {
    const channelName = `linquo:conversation:${conversationId}:messages`;
    const channel = this.supabase?.channel(channelName);
    
    if (!channel) {
      return; // Fail silently for typing indicators
    }

    await channel.send({
      type: 'broadcast',
      event: 'typing',
      payload: {
        isTyping,
        userId,
        userType,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(conversationId: string): void {
    const connection = this.channels.get(conversationId);
    if (!connection) return;

    const attempts = this.reconnectAttempts.get(conversationId) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached for conversation:', conversationId);
      connection.isReconnecting = false;
      return;
    }

    connection.isReconnecting = true;
    this.reconnectAttempts.set(conversationId, attempts + 1);

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, attempts), 16000);
    
    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.reconnectChannel(conversationId);
    }, delay);
  }

  /**
   * Reconnect a specific channel
   */
  private reconnectChannel(conversationId: string): void {
    const connection = this.channels.get(conversationId);
    if (connection) {
      console.log('🔄 Reconnecting channel for conversation:', conversationId);
      try {
        this.supabase?.removeChannel(connection.channel);
      } catch (error) {
        console.error('❌ Error removing channel during reconnect:', error);
      }
      // The channel will be recreated by the component
    }
  }

  /**
   * Remove a channel with proper cleanup
   */
  removeChannel(conversationId: string): void {
    const connection = this.channels.get(conversationId);
    if (connection) {
      console.log('🔌 Disconnecting realtime channel for conversation:', conversationId);
      try {
        this.supabase?.removeChannel(connection.channel);
      } catch (error) {
        console.error('❌ Error removing channel:', error);
      }
      this.channels.delete(conversationId);
    }
  }

  /**
   * Remove all channels with proper cleanup
   */
  disconnectAll(): void {
    console.log('🔌 Disconnecting all realtime channels');
    this.channels.forEach((connection, conversationId) => {
      try {
        this.supabase?.removeChannel(connection.channel);
      } catch (error) {
        console.error('❌ Error removing channel:', conversationId, error);
      }
    });
    this.channels.clear();
  }

  /**
   * Get connection status for a conversation
   */
  getConnectionStatus(conversationId: string): boolean {
    return this.channels.get(conversationId)?.isConnected || false;
  }
}

// Export singleton instance
export const realtimeService = new RealtimeService();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    realtimeService.disconnectAll();
  });
}
