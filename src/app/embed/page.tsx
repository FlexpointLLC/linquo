"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Composer } from "@/components/chat/composer";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { useSearchParams } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";

function EmbedContent() {
  const params = useSearchParams();
  const initialCid = params.get("cid");
  const site = params.get("site");
  const [cid, setCid] = useState<string | null>(initialCid);

  useEffect(() => {
    async function ensureConversation() {
      if (cid || !site) return;
      const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
      if (!client) return;
      // Find existing conversation by title=site or create one
      const { data: existing } = await client
        .from("conversations")
        .select("id")
        .eq("title", site)
        .limit(1)
        .maybeSingle();
      if (existing?.id) {
        setCid(existing.id as string);
        return;
      }
      const { data: created, error } = await client
        .from("conversations")
        .insert({ title: site, last_message_at: new Date().toISOString() })
        .select("id")
        .single();
      if (!error && created?.id) {
        setCid(created.id as string);
      }
    }
    ensureConversation();
  }, [cid, site]);

  const { data: messageRows } = useMessages(cid);
  const messages = useMemo<ChatMessage[]>(() => {
    return (messageRows ?? []).map((m) => ({
      id: m.id,
      author: m.author as ChatMessage["author"],
      name: m.name,
      text: m.text,
      time: new Date(m.created_at).toLocaleTimeString(),
    }));
  }, [messageRows]);

  return (
    <div className="h-full w-full bg-background text-foreground">
      <div className="border-b p-3 flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        <div className="font-medium text-sm">Support</div>
      </div>
      <ScrollArea className="h-[calc(100vh-120px)]">
        <MessageThread messages={messages} />
      </ScrollArea>
      <Composer
        onSend={async (text) => {
          const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
          if (!client || !cid) return;
          await client.from("messages").insert({ conversation_id: cid, author: "customer", name: "You", text });
          await client.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", cid);
        }}
      />
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={<div className="h-full w-full bg-background flex items-center justify-center">Loading...</div>}>
      <EmbedContent />
    </Suspense>
  );
}


