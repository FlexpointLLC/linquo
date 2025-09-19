"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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

  // Debug logging
  useEffect(() => {
    console.log("Dashboard Debug:", {
      currentTab,
      activeId,
      conversationRows: conversationRows?.length,
      messageRows: messageRows?.length,
      conversationData: conversationRows,
      messageData: messageRows,
      errors: {
        conversationError,
        messageError,
        agentsError,
        customersError,
      },
    });
  }, [currentTab, activeId, conversationRows, messageRows, conversationError, messageError, agentsError, customersError]);

  return (
    <div className="p-0">
      {/* Error Display */}
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
              // Extract customer name from conversation title (format: "Name (website)")
              const customerName = c.title.split(" (")[0];
              const customer = customers?.find(cust => cust.name === customerName);
              
              return { 
                id: c.id, 
                name: c.title, 
                lastMessage: "",
                status: customer?.status
              };
            })}
            activeId={activeId ?? undefined}
            onSelect={(id) => {
              const url = new URL(window.location.href);
              url.searchParams.set("cid", id);
              router.push(url.pathname + "?" + url.searchParams.toString());
            }}
          />
          <div className="flex flex-col">
            {/* Conversation Header with Status */}
            {activeId && (
              <div className="border-b p-3 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {conversationRows?.find(c => c.id === activeId)?.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const conversation = conversationRows?.find(c => c.id === activeId);
                      const customerName = conversation?.title.split(" (")[0];
                      const customer = customers?.find(cust => cust.name === customerName);
                      return customer ? (
                        <select
                          value={customer.status}
                          onChange={async (e) => {
                            const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                            if (!client) return;
                            await client
                              .from("customers")
                              .update({ status: e.target.value as "active" | "solved" | "churned" | "trial" })
                              .eq("id", customer.id);
                          }}
                          className="text-xs px-2 py-1 rounded border bg-background"
                        >
                          <option value="active">Active</option>
                          <option value="solved">Solved</option>
                          <option value="trial">Trial</option>
                          <option value="churned">Churned</option>
                        </select>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            )}
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
                if (!client || !agent) return;
                await client.from("messages").insert({
                  conversation_id: activeId,
                  author: "agent",
                  name: agent.name,
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
