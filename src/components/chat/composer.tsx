"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Zap, MoreHorizontal } from "lucide-react";

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
    <div className="p-4 bg-white border-t">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <div className="text-xs text-gray-500 mb-1">
            Reply {customerEmail || "customer"}
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a reply..."
            className="min-h-[80px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="text-xs text-gray-400 mt-1">
            Use ⌘K for shortcuts
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Zap className="h-4 w-4 text-gray-400" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4 text-gray-400" />
          </Button>
          <Button 
            onClick={handleSend}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
            disabled={!text.trim()}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}


