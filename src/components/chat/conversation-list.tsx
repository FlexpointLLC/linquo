export type ConversationListItem = {
  id: string;
  name: string;
  lastMessage: string;
  unread?: number;
  status?: "ACTIVE" | "BLOCKED";
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
    <div className="border-r w-80 shrink-0">
      <div className="p-3 text-sm font-medium">Conversations</div>
      <div className="divide-y">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <div className="text-sm">No conversations yet</div>
            <div className="text-xs mt-1">Start a conversation to see it here</div>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect?.(c.id)}
              className={
                "w-full text-left p-3 hover:bg-muted transition-colors " +
                (activeId === c.id ? "bg-muted" : "")
              }
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium truncate">{c.name}</div>
                <div className="flex items-center gap-1">
                  {c.status && (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                      c.status === "ACTIVE" ? "bg-green-100 text-green-800" :
                      c.status === "BLOCKED" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {c.status?.toLowerCase()}
                    </span>
                  )}
                  {c.unread ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] h-5 w-5">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
