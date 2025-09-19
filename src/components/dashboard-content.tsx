"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { Composer } from "@/components/chat/composer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
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
              const customer = customers?.find(cust => cust.id === c.customer_id);
              const lastMessage = messageRows?.find(m => m.conversation_id === c.id);
              return {
                id: c.id, 
                name: customer?.display_name || "Unknown Customer",
                email: customer?.email,
                lastMessage: lastMessage?.body_text || "No messages yet",
                status: "ACTIVE" as const,
                timestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : undefined
              };
            })}
            activeId={activeId ?? undefined}
            onSelect={(id) => {
              const url = new URL(window.location.href);
              url.searchParams.set("cid", id);
              router.push(url.pathname + "?" + url.searchParams.toString());
            }}
          />
          <div className="flex flex-col h-full bg-white">
            {/* Conversation Header with Actions */}
            {activeId && (
              <div className="border-b p-4 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const conversation = conversationRows?.find(c => c.id === activeId);
                          const customer = customers?.find(c => c.id === conversation?.customer_id);
                          return customer?.email || `Conversation ${activeId?.slice(0, 8)}`;
                        })()}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600">
                      Call
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600">
                      Snooze
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600">
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                <MessageThread
                  messages={(messageRows ?? []).map((m) => {
                    const customer = customers?.find(c => c.id === m.customer_id);
                    return {
                      id: m.id,
                      author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
                      name: m.sender_type === "AGENT" ? "Agent" : customer?.display_name || "Customer",
                      email: m.sender_type === "CUSTOMER" ? customer?.email : undefined,
                      text: m.body_text,
                      time: new Date(m.created_at).toLocaleTimeString(),
                    };
                  }) as ChatMessage[]}
                />
              </ScrollArea>
            </div>
            <div className="flex-shrink-0">
              <Composer
              customerEmail={(() => {
                const conversation = conversationRows?.find(c => c.id === activeId);
                const customer = customers?.find(c => c.id === conversation?.customer_id);
                return customer?.email;
              })()}
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
