import React from 'react';
import { ChatIcon } from './chat-icon';
import { X } from 'lucide-react';
import { useBrandColor } from "@/contexts/brand-color-context";

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatBubble({ isOpen, onClick }: ChatBubbleProps) {
  const { brandColor } = useBrandColor();
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-[68px] h-[68px] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-opacity-50 z-50"
      style={{ 
        backgroundColor: brandColor,
        boxShadow: `0 4px 12px ${brandColor}40`
      }}
      aria-label={isOpen ? "Close chat" : "Open chat"}
    >
      <div className="flex items-center justify-center w-full h-full">
        {isOpen ? (
          <X className="w-6 h-6 text-white" />
        ) : (
          <ChatIcon className="w-6 h-6" />
        )}
      </div>
    </button>
  );
}
