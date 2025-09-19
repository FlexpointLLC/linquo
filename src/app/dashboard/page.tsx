"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { Composer } from "@/components/chat/composer";
import { AgentsTable } from "@/components/tables/agents-table";
import { CustomersTable } from "@/components/tables/customers-table";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { useAgents } from "@/hooks/useAgents";
import { useCustomers } from "@/hooks/useCustomers";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";

// Force dynamic rendering and disable static optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState("chats");
  const [activeId, setActiveId] = useState("1");

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "chats";
    const cid = searchParams.get("cid") ?? "1";
    setCurrentTab(tab);
    setActiveId(cid);
  }, [searchParams]);

  const { data: conversationRows } = useConversations();
  const { data: messageRows } = useMessages(currentTab === "chats" ? activeId : null);

  const { data: agents } = useAgents();
  const { data: customers } = useCustomers();

  return (
    <div className="p-0">
      {currentTab === "chats" && (
        <div className="rounded-md border grid grid-cols-[320px_1fr] min-h-[60vh]">
          <ConversationList
            conversations={(conversationRows ?? []).map((c) => ({ id: c.id, name: c.title, lastMessage: "" }))}
            activeId={activeId}
            onSelect={(id) => {
              const url = new URL(window.location.href);
              url.searchParams.set("cid", id);
              router.push(url.pathname + "?" + url.searchParams.toString());
            }}
          />
          <div className="flex flex-col">
            <MessageThread
              messages={(messageRows ?? []).map((m) => ({
                id: m.id,
                author: m.author as ChatMessage["author"],
                name: m.name,
                text: m.text,
                time: new Date(m.created_at).toLocaleTimeString(),
              })) as ChatMessage[]}
            />
            <Composer
              onSend={async (text) => {
                const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                if (!client) return;
                await client.from("messages").insert({
                  conversation_id: activeId,
                  author: "agent",
                  name: "You",
                  text,
                });
                await client
                  .from("conversations")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", activeId);
              }}
            />
          </div>
        </div>
      )}

      {currentTab === "agents" && agents && (
        <div className="rounded-md border p-4">
          <AgentsTable data={agents} />
        </div>
      )}

      {currentTab === "customers" && customers && (
        <div className="rounded-md border p-4">
          <CustomersTable data={customers} />
        </div>
      )}

      {currentTab === "settings" && (
        <div className="rounded-md border p-4">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}


