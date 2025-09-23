"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState, useEffect, memo } from "react";
import { useDashboardBrandColor } from "@/contexts/dashboard-brand-color-context";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";

export const Composer = memo(function Composer({ 
  onSend, 
  customerEmail,
  conversationId,
  agentId
}: { 
  onSend?: (text: string) => void;
  customerEmail?: string;
  conversationId?: string;
  agentId?: string;
}) {
  const [text, setText] = useState("");
  const { brandColor } = useDashboardBrandColor();
  const { typingUsers, handleTypingStart, handleTypingStop } = useTypingIndicator(
    conversationId || null,
    agentId || '',
    'agent'
  );

  // Restore text from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedText = localStorage.getItem('dashboard-composer-text');
      if (savedText) {
        setText(savedText);
        // Clear the saved text after restoring
        localStorage.removeItem('dashboard-composer-text');
      }
    }
  }, []);

  // Save text to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && text) {
      localStorage.setItem('dashboard-composer-text', text);
    }
  }, [text]);
  
  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    
    // Stop typing indicator
    handleTypingStop();
    
    console.log("🚀 Composer handleSend called with:", trimmed);
    console.log("📤 onSend function available:", !!onSend);
    
    onSend?.(trimmed);
    setText("");
    // Clear saved text from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('dashboard-composer-text');
    }
  }
  
  return (
    <div className="px-3 bg-background">
      {/* Reply text */}
      <div className="text-xs text-muted-foreground mb-1">
        Reply {customerEmail || "customer"}
      </div>
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (e.target.value.trim()) {
              handleTypingStart();
            } else {
              handleTypingStop();
            }
          }}
          placeholder="Write a reply..."
          className="min-h-[80px] resize-none border-border pr-20"
          style={{ '--tw-ring-color': brandColor, '--tw-border-color': brandColor } as React.CSSProperties}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="absolute bottom-2 right-2">
          <Button 
            onClick={handleSend}
            className="text-white px-3 py-1 h-7 text-xs disabled:bg-gray-400 disabled:hover:bg-gray-400"
            style={{ backgroundColor: brandColor }}
            disabled={!text.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
});


