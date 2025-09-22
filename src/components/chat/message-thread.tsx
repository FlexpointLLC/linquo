import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardBrandColor } from "@/contexts/dashboard-brand-color-context";
import { useEffect, useRef, memo } from "react";

export type ChatMessage = {
  id: string;
  author: "agent" | "customer";
  name: string;
  text: string;
  time: string;
  email?: string;
  avatar?: string;
};

export const MessageThread = memo(function MessageThread({ messages }: { messages: ChatMessage[] }) {
  const { brandColor } = useDashboardBrandColor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages]);

  return (
    <div className="p-3 bg-background">
      <div className="flex flex-col gap-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start a conversation by sending a message below</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-2">
              {m.author === "customer" && (
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {m.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex-1 ${m.author === "agent" ? "flex justify-end" : ""}`}>
                <div className={`max-w-[70%] ${m.author === "agent" ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-foreground">
                      {m.email || m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.time}
                    </span>
                  </div>
                  
                  <div
                    className={`rounded-lg px-3 py-2 inline-block ${
                      m.author === "agent"
                        ? "text-white"
                        : "bg-muted text-foreground"
                    }`}
                    style={m.author === "agent" ? { backgroundColor: brandColor } : {}}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                  </div>
                </div>
              </div>
              
              {m.author === "agent" && (
                <Avatar className="h-6 w-6 flex-shrink-0">
                  <AvatarFallback 
                    className="text-xs"
                    style={{ backgroundColor: brandColor + '20', color: brandColor }}
                  >
                    {m.name?.slice(0, 2).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});


