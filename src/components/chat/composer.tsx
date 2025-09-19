"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function Composer({ 
  onSend, 
  customerEmail 
}: { 
  onSend?: (text: string) => void;
  customerEmail?: string;
}) {
  const [text, setText] = useState("");
  
  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSend?.(trimmed);
    setText("");
  }
  
  return (
    <div className="p-3 bg-white border-t">
      <div className="text-xs text-gray-500 mb-1">
        Reply {customerEmail || "customer"}
      </div>
      <div className="relative">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a reply..."
          className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500 pr-20"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <div className="absolute bottom-2 right-2 flex items-center gap-1">
          <Button 
            onClick={handleSend}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 h-7 text-xs"
            disabled={!text.trim()}
          >
            Send
          </Button>
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>
      <div className="text-xs text-gray-400 mt-1">
        Use ⌘K for shortcuts
      </div>
    </div>
  );
}


