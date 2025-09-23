import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardBrandColor } from "@/contexts/dashboard-brand-color-context";
import { useEffect, useRef, memo } from "react";

interface TypingUser {
  id: string;
  name: string;
  type: 'agent' | 'customer';
}

// Function to detect URLs and make them clickable
const formatMessageText = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    // Check if this part is a URL by testing against the regex
    if (part.match(/^https?:\/\/[^\s]+$/)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-white hover:text-gray-200 visited:text-yellow-300 underline break-all"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export type ChatMessage = {
  id: string;
  author: "agent" | "customer";
  name: string;
  text: string;
  time: string;
  email?: string;
  avatar?: string;
};

export const MessageThread = memo(function MessageThread({ 
  messages, 
  isSidebarOpen, 
  typingUsers = [] 
}: { 
  messages: ChatMessage[], 
  isSidebarOpen?: boolean,
  typingUsers?: TypingUser[]
}) {
  const { brandColor } = useDashboardBrandColor();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive or typing users change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messages, typingUsers]);

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
                <Avatar className="h-6 w-6 flex-shrink-0 ml-2">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {m.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex-1 ${m.author === "agent" ? "flex justify-end" : ""}`}>
                <div className={`${isSidebarOpen ? 'max-w-[75%]' : 'max-w-[70%]'} ${m.author === "agent" ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 mb-1 ${m.author === "agent" ? "justify-end" : ""}`}>
                    <span className="text-xs font-medium text-foreground">
                      {m.email || m.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {m.time}
                    </span>
                  </div>
                  
                  <div
                    className={`rounded-lg px-3 py-2 ${m.author === "agent" ? "inline-block ml-auto" : "inline-block"} max-w-[600px] ${
                      m.author === "agent"
                        ? "text-white"
                        : "bg-muted text-foreground"
                    }`}
                    style={m.author === "agent" ? { backgroundColor: brandColor } : {}}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words overflow-wrap-anywhere word-break-break-all">
                      {formatMessageText(m.text)}
                    </p>
                  </div>
                </div>
              </div>
              
              {m.author === "agent" && (
                <Avatar className="h-6 w-6 flex-shrink-0 mr-2">
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
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <div className="flex gap-2">
            {typingUsers.map((user) => (
              <div key={user.id} className="flex gap-2">
                {user.type === "customer" && (
                  <Avatar className="h-6 w-6 flex-shrink-0 ml-2">
                    <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                      {user.name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className={`flex-1 ${user.type === "agent" ? "flex justify-end" : ""}`}>
                  <div className={`${isSidebarOpen ? 'max-w-[75%]' : 'max-w-[70%]'} ${user.type === "agent" ? "text-right" : ""}`}>
                    <div
                      className={`rounded-lg px-3 py-2 ${user.type === "agent" ? "inline-block ml-auto" : "inline-block"} max-w-[600px] ${
                        user.type === "agent"
                          ? "text-white"
                          : "bg-muted text-foreground"
                      }`}
                      style={user.type === "agent" ? { backgroundColor: brandColor } : {}}
                    >
                      <div className="flex items-center gap-1.5 whitespace-nowrap">
                        <div className="flex space-x-0.5">
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-1 h-1 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-xs opacity-70 break-words overflow-wrap-anywhere">
                          {user.name} is typing...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {user.type === "agent" && (
                  <Avatar className="h-6 w-6 flex-shrink-0 mr-2">
                    <AvatarFallback 
                      className="text-xs"
                      style={{ backgroundColor: brandColor + '20', color: brandColor }}
                    >
                      {user.name?.slice(0, 2).toUpperCase() || "A"}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
});


