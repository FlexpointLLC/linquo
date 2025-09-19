import { ScrollArea } from "@/components/ui/scroll-area";

export type ChatMessage = {
  id: string;
  author: "agent" | "customer";
  name: string;
  text: string;
  time: string;
};

export function MessageThread({ messages }: { messages: ChatMessage[] }) {
  return (
    <ScrollArea className="h-[calc(100vh-200px)] p-4">
      <div className="flex flex-col gap-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start a conversation by sending a message below</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex flex-col gap-1">
              <div className="text-xs text-muted-foreground">
                {m.name} • {m.time}
              </div>
              <div
                className={
                  "rounded-md p-3 max-w-[70%] " +
                  (m.author === "agent"
                    ? "bg-primary text-primary-foreground self-end"
                    : "bg-muted")
                }
              >
                {m.text}
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}


