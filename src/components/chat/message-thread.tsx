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
        {messages.map((m) => (
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
        ))}
      </div>
    </ScrollArea>
  );
}


