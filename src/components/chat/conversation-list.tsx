import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export type ConversationListItem = {
  id: string;
  name: string;
  email?: string;
  lastMessage: string;
  unread?: number;
  status?: "ACTIVE" | "BLOCKED";
  timestamp?: string;
  avatar?: string;
};

export function ConversationList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: ConversationListItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
}) {

  return (
    <div className="border-r w-80 shrink-0 bg-white h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Conversations</h2>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-500">Newest</span>
        </div>
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-gray-100 flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            <div className="text-sm">No conversations yet</div>
            <div className="text-xs mt-1">Start a conversation to see it here</div>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className={
                "w-full text-left p-3 hover:bg-gray-50 transition-colors " +
                (activeId === c.id ? "bg-blue-50 border-r-2 border-blue-500" : "")
              }
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                    {c.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {c.name}
                    </div>
                    {c.timestamp && (
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {c.timestamp}
                      </span>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-600 truncate mb-1">
                    {c.lastMessage || "No messages yet"}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {c.unread && c.unread > 0 && (
                      <div className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white text-xs h-4 w-4">
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
