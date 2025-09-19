export type ConversationListItem = {
  id: string;
  name: string;
  lastMessage: string;
  unread?: number;
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
        {conversations.map((c) => (
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
              {c.unread ? (
                <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] h-5 w-5">
                  {c.unread}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground truncate">{c.lastMessage}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
