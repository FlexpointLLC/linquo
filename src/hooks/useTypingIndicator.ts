"use client";
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface TypingUser {
  id: string;
  name: string;
  type: 'agent' | 'customer';
}

export function useTypingIndicator(conversationId: string | null, currentUserId: string, currentUserType: 'agent' | 'customer') {
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Send typing event
  const sendTypingEvent = useCallback(async (isCurrentlyTyping: boolean) => {
    if (!conversationId) return;

    try {
      const supabase = createClient();
      if (!supabase) return;

      const channel = supabase.channel(`typing:${conversationId}`);
      
      await channel.send({
        type: 'broadcast',
        event: 'typing',
        payload: {
          conversationId,
          userId: currentUserId,
          userType: currentUserType,
          isTyping: isCurrentlyTyping,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error sending typing event:', error);
    }
  }, [conversationId, currentUserId, currentUserType]);

  // Handle typing start
  const handleTypingStart = useCallback(() => {
    if (isTyping) return;
    
    setIsTyping(true);
    sendTypingEvent(true);

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    const timeout = setTimeout(() => {
      setIsTyping(false);
      sendTypingEvent(false);
    }, 3000);

    setTypingTimeout(timeout);
  }, [isTyping, sendTypingEvent, typingTimeout]);

  // Handle typing stop
  const handleTypingStop = useCallback(() => {
    if (!isTyping) return;
    
    setIsTyping(false);
    sendTypingEvent(false);

    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
  }, [isTyping, sendTypingEvent, typingTimeout]);

  // Listen for typing events
  useEffect(() => {
    if (!conversationId) return;

    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel.on('broadcast', { event: 'typing' }, (payload) => {
      const { userId, userType, isTyping: userIsTyping } = payload.payload;
      
      // Don't show typing indicator for current user
      if (userId === currentUserId) return;

      setTypingUsers(prev => {
        if (userIsTyping) {
          // Add or update typing user
          const existingUser = prev.find(u => u.id === userId);
          if (existingUser) {
            return prev.map(u => u.id === userId ? { ...u, name: userType === 'agent' ? 'Agent' : 'Customer', type: userType } : u);
          } else {
            return [...prev, { id: userId, name: userType === 'agent' ? 'Agent' : 'Customer', type: userType }];
          }
        } else {
          // Remove typing user
          return prev.filter(u => u.id !== userId);
        }
      });
    });

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId, currentUserId]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return {
    typingUsers,
    isTyping,
    handleTypingStart,
    handleTypingStop
  };
}
