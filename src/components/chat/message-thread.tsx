import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export type ChatMessage = {
  id: string;
  author: "agent" | "customer";
  name: string;
  text: string;
  time: string;
  email?: string;
  avatar?: string;
};

export function MessageThread({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="p-6">
      <div className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-gray-500">
            <div className="text-center">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs">Start a conversation by sending a message below</p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className="flex gap-3">
              {m.author === "customer" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                    {m.name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              
              <div className={`flex-1 ${m.author === "agent" ? "flex justify-end" : ""}`}>
                <div className={`max-w-[70%] ${m.author === "agent" ? "text-right" : ""}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {m.email || m.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {m.time}
                    </span>
                  </div>
                  
                  <div
                    className={`rounded-lg p-3 ${
                      m.author === "agent"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-900"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{m.text}</p>
                  </div>
                </div>
              </div>
              
              {m.author === "agent" && (
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                    {m.name?.slice(0, 2).toUpperCase() || "A"}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}


