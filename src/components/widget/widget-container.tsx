"use client";
import React, { useState } from 'react';
import { ChatBubble } from './chat-bubble';
import { ErrorBoundary } from '@/components/error-boundary';

interface WidgetContainerProps {
  orgId?: string;
  site?: string;
  brandColor?: string;
}

export function WidgetContainer({ orgId, site, brandColor }: WidgetContainerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleWidget = () => {
    setIsOpen(!isOpen);
  };

  const closeWidget = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Chat Bubble */}
      <ChatBubble 
        isOpen={isOpen} 
        onClick={toggleWidget}
        brandColor={brandColor}
      />
      
      {/* Widget iframe when open */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-40">
          <iframe
            src={`/embed?org=${orgId}&site=${encodeURIComponent(site || window.location.origin)}`}
            className="w-full h-full rounded-lg"
            style={{ border: 'none' }}
            title="Chat Widget"
          />
        </div>
      )}
    </>
  );
}
