import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardBrandColor } from "@/contexts/dashboard-brand-color-context";
import { useState } from "react";

export type ConversationListItem = {
  id: string;
  name: string;
  email?: string;
  lastMessage: string;
  unread?: number;
  status?: "ACTIVE" | "BLOCKED";
  state?: "OPEN" | "CLOSED";
  timestamp?: string;
  avatar?: string;
  created_at?: string;
};

type ChatTab = "open" | "newest" | "resolved";

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {
  const { brandColor } = useDashboardBrandColor();
  const [activeTab, setActiveTab] = useState<ChatTab>("open");
  
  // Filter conversations based on active tab
  const filteredConversations = conversations.filter(conv => {
    const today = new Date();
    const convDate = conv.created_at ? new Date(conv.created_at) : new Date(conv.timestamp || '');
    const isToday = convDate.toDateString() === today.toDateString();
    
    switch (activeTab) {
      case "open":
        return conv.state !== "CLOSED";
      case "newest":
        return isToday; // Show ALL conversations from today (both open and resolved)
      case "resolved":
        return conv.state === "CLOSED";
      default:
        return true;
    }
  });
  
  const openCount = conversations.filter(c => c.state !== "CLOSED").length;
  const newestCount = conversations.filter(c => {
    const today = new Date();
    const convDate = c.created_at ? new Date(c.created_at) : new Date(c.timestamp || '');
    return convDate.toDateString() === today.toDateString(); // Count ALL conversations from today
  }).length;
  const resolvedCount = conversations.filter(c => c.state === "CLOSED").length;

  return (
    <div className="border-r w-80 shrink-0 bg-background h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="px-3 pt-3 pb-0 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-4 text-sm">
          <button
            onClick={() => setActiveTab("open")}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === "open"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "open" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Open ({openCount})
          </button>
          <button
            onClick={() => setActiveTab("newest")}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === "newest"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "newest" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Newest ({newestCount})
          </button>
          <button
            onClick={() => setActiveTab("resolved")}
            className={`pb-2 px-1 font-medium transition-colors ${
              activeTab === "resolved"
                ? "border-b-2"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={activeTab === "resolved" ? { 
              borderBottomColor: brandColor,
              color: brandColor 
            } : {}}
          >
            Resolved ({resolvedCount})
          </button>
        </div>
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-border flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <div className="text-sm">
              {activeTab === "open" && "No open conversations"}
              {activeTab === "newest" && "No conversations today"}
              {activeTab === "resolved" && "No resolved conversations"}
            </div>
            <div className="text-xs mt-1">
              {activeTab === "open" && "All conversations are resolved"}
              {activeTab === "newest" && "No new conversations today"}
              {activeTab === "resolved" && "No conversations have been resolved yet"}
            </div>
          </div>
        ) : (
          filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className={
                "w-full text-left p-3 hover:bg-muted transition-colors " +
                (activeId === c.id ? "border-r-2 bg-muted" : "")
              }
              style={activeId === c.id ? { borderRightColor: brandColor } : {}}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                    {c.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-foreground truncate text-sm">
                      {c.name}
                    </div>
                    {c.timestamp && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {c.timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground truncate mb-1">
                    {c.lastMessage || "No messages yet"}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {c.unread && c.unread > 0 && (
                      <div 
                        className="inline-flex items-center justify-center rounded-full text-white text-xs h-4 w-4"
                        style={{ backgroundColor: brandColor }}
                      >
                        {c.unread}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
