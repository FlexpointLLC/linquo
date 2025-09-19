"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { Composer } from "@/components/chat/composer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentsTable } from "@/components/tables/agents-table";
import { CustomersTable } from "@/components/tables/customers-table";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { useAgents } from "@/hooks/useAgents";
import { useCustomers } from "@/hooks/useCustomers";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useAuth } from "@/hooks/useAuth";

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState("chats");
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "chats";
    const cid = searchParams.get("cid");
    setCurrentTab(tab);
    setActiveId(cid);
  }, [searchParams]);

  const { data: conversationRows, error: conversationError } = useConversations();
  const { data: messageRows, error: messageError } = useMessages(currentTab === "chats" ? activeId : null);

  const { data: agents, error: agentsError } = useAgents();
  const { data: customers, error: customersError } = useCustomers();
  const { agent } = useAuth();

  // Auto-select first conversation if none is selected
  useEffect(() => {
    if (currentTab === "chats" && !activeId && conversationRows && conversationRows.length > 0) {
      const firstConversationId = conversationRows[0].id;
      const url = new URL(window.location.href);
      url.searchParams.set("cid", firstConversationId);
      router.push(url.pathname + "?" + url.searchParams.toString());
    }
  }, [currentTab, activeId, conversationRows, router]);


  return (
    <div className="p-0">
      {/* Error Display - Only show for actual errors, not empty data */}
      {(conversationError || messageError || agentsError || customersError) && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <h4 className="text-sm font-medium text-red-800">Connection Issues:</h4>
          <ul className="text-xs text-red-600 mt-1">
            {conversationError && <li>Conversations: {conversationError}</li>}
            {messageError && <li>Messages: {messageError}</li>}
            {agentsError && <li>Agents: {agentsError}</li>}
            {customersError && <li>Customers: {customersError}</li>}
          </ul>
        </div>
      )}
      
      {currentTab === "chats" && (
        <div className="rounded-md border grid grid-cols-[320px_1fr] min-h-[60vh]">
          <ConversationList
            conversations={(conversationRows ?? []).map((c) => {
              // Since conversations don't have titles, create a generic name
              const conversationName = c.title || `Conversation ${c.id.slice(0, 8)}`;
              
              return { 
                id: c.id, 
                name: conversationName, 
                lastMessage: "",
                status: "ACTIVE" as const
              };
            })}
            activeId={activeId ?? undefined}
            onSelect={(id) => {
              const url = new URL(window.location.href);
              url.searchParams.set("cid", id);
              router.push(url.pathname + "?" + url.searchParams.toString());
            }}
          />
          <div className="flex flex-col h-full">
            {/* Conversation Header with Status */}
            {activeId && (
              <div className="border-b p-3 bg-muted/50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {conversationRows?.find(c => c.id === activeId)?.title || `Conversation ${activeId?.slice(0, 8)}`}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      // Since conversations don't have titles, we'll just show a generic status
                      return (
                        <span className="text-xs px-2 py-1 rounded border bg-background text-muted-foreground">
                          Active
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <MessageThread
                  messages={(messageRows ?? []).map((m) => ({
                    id: m.id,
                    author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
                    name: m.sender_type === "AGENT" ? "Agent" : "Customer",
                    text: m.body_text,
                    time: new Date(m.created_at).toLocaleTimeString(),
                  })) as ChatMessage[]}
                />
              </ScrollArea>
            </div>
            <div className="flex-shrink-0 border-t">
              <Composer
              onSend={async (text) => {
                const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                if (!client || !agent) return;
                await client.from("messages").insert({
                  conversation_id: activeId,
                  sender_type: "AGENT",
                  agent_id: agent.id,
                  org_id: agent.org_id, // Include org_id for agent messages
                  body_text: text,
                });
                await client
                  .from("conversations")
                  .update({ last_message_at: new Date().toISOString() })
                  .eq("id", activeId);
              }}
            />
            </div>
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
