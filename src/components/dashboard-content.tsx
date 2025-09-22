"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { Composer } from "@/components/chat/composer";
import { AgentsTable } from "@/components/tables/agents-table";
import { CustomersTable } from "@/components/tables/customers-table";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { EmbedSettings } from "@/components/embed/embed-settings";
import { useDataCache } from "@/hooks/useDataCache";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useLastMessages } from "@/hooks/useLastMessages";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Check, RotateCcw, Loader2 } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { toast } from "sonner";

export function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState("chats");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resolvingConversationId, setResolvingConversationId] = useState<string | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "chats";
    const cid = searchParams.get("cid");
    setCurrentTab(tab);
    setActiveId(cid);
  }, [searchParams]);

  const { data: conversationRows, error: conversationError } = useConversations();
  const { data: messageRows, error: messageError } = useMessages(currentTab === "chats" ? activeId : null);
  
  // Memoize conversation IDs to prevent infinite loops
  const conversationIds = useMemo(() => 
    conversationRows?.map(c => c.id) || [], 
    [conversationRows]
  );
  const { data: lastMessages } = useLastMessages(conversationIds);

  const { agents, customers } = useDataCache();
  const { agent } = useAuth();

  // Handle resolve/unresolve conversation
  const handleResolveConversation = async (conversationId: string, currentState: string) => {
    try {
      setResolvingConversationId(conversationId);
      
      const supabase = getSupabaseBrowser();
      if (!supabase) {
        toast.error("Unable to connect to server");
        return;
      }

      const newState = currentState === "CLOSED" ? "OPEN" : "CLOSED";
      const action = newState === "CLOSED" ? "resolved" : "reopened";
      
      const { error } = await supabase
        .from("conversations")
        .update({ state: newState })
        .eq("id", conversationId);

      if (error) {
        console.error("Error updating conversation state:", error);
        toast.error(`Failed to ${action} conversation`);
      } else {
        toast.success(`Conversation ${action} successfully`);
      }
    } catch (error) {
      console.error("Error resolving conversation:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setResolvingConversationId(null);
    }
  };



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
    <div className="h-[calc(100vh-80px)] w-full">
      {/* Error Display - Only show for actual errors, not empty data */}
      {(conversationError || messageError) && (
        <div className="p-3 bg-red-50 border border-red-200">
          <h4 className="text-sm font-medium text-red-800">Connection Issues:</h4>
          <ul className="text-xs text-red-600 mt-1">
            {conversationError && <li>Conversations: {conversationError}</li>}
            {messageError && <li>Messages: {messageError}</li>}
          </ul>
        </div>
      )}

      {currentTab === "chats" && (
        <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-80px)] -m-6">
              <ConversationList
                conversations={(conversationRows ?? []).map((c) => {
                  const lastMessage = lastMessages?.find(m => m.conversation_id === c.id);
                  
                  return {
                    id: c.id,
                    name: c.customers?.display_name || "Unknown Customer",
                    email: c.customers?.email,
                    lastMessage: lastMessage?.body_text || "No messages yet",
                    status: "ACTIVE" as const,
                    state: c.state || "OPEN",
                    timestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : undefined,
                    created_at: c.created_at
                  };
                })}
                activeId={activeId ?? undefined}
                onSelect={(id) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("cid", id);
                  router.push(url.pathname + "?" + url.searchParams.toString());
                }}
              />
          <div className="flex flex-col h-[calc(100vh-80px)] bg-white">
            {/* Conversation Header with Actions */}
            {activeId && (
              <div className="border-b p-3 bg-white flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {(() => {
                          const conversation = conversationRows?.find(c => c.id === activeId);
                          return conversation?.customers?.display_name || `Conversation ${activeId?.slice(0, 8)}`;
                        })()}
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const conversation = conversationRows?.find(c => c.id === activeId);
                      const currentState = conversation?.state || "OPEN";
                      const isResolved = currentState === "CLOSED";
                      
                      const isLoading = resolvingConversationId === activeId;
                      
                      return (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleResolveConversation(activeId, currentState)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {isResolved ? "Opening..." : "Resolving..."}
                            </>
                          ) : isResolved ? (
                            <>
                              <RotateCcw className="h-4 w-4" />
                              Open Again
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" />
                              Resolve
                            </>
                          )}
                        </Button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {activeId ? (
                <MessageThread
                    messages={(messageRows ?? []).map((m) => {
                      const customer = customers?.find(c => c.id === m.customer_id);
                      const agent = agents?.find(a => a.id === m.agent_id);
                      return {
                        id: m.id,
                        author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
                        name: m.sender_type === "AGENT" ? (agent?.display_name || "Agent") : (customer?.display_name || "Customer"),
                        email: m.sender_type === "CUSTOMER" ? customer?.email : undefined,
                        text: m.body_text,
                        time: new Date(m.created_at).toLocaleTimeString(),
                      };
                    }) as ChatMessage[]}
                  />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="text-gray-400 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a conversation from the list to start chatting</p>
                  </div>
                </div>
              )}
            </div>
            {activeId && (
              <div className="border-t border-gray-200 p-4 bg-white">
                <Composer
                  conversationId={activeId}
                  agentId={agent?.id}
                  customerEmail={conversationRows?.find(c => c.id === activeId)?.customers?.email}
                  onSend={async (text) => {
                    if (!agent || !activeId) {
                      console.log("❌ Missing agent or activeId");
                      return;
                    }

                    const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                    if (!client) {
                      console.log("❌ Supabase client not available");
                      return;
                    }

                    try {
                      console.log("📝 Inserting message to Supabase...");
                      const { error: messageError } = await client.from("messages").insert({
                        conversation_id: activeId,
                        sender_type: "AGENT",
                        agent_id: agent.id,
                        org_id: agent.org_id,
                        body_text: text,
                      });

                      if (messageError) {
                        console.log("❌ Error inserting message:", messageError);
                        return;
                      }

                      console.log("✅ Message inserted successfully");
                      
                      await client
                        .from("conversations")
                        .update({ last_message_at: new Date().toISOString() })
                        .eq("id", activeId);
                      
                      console.log("✅ Conversation timestamp updated");
                    } catch (error) {
                      console.log("❌ Error sending message:", error);
                    }
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {currentTab === "agents" && (
        <div className="h-full">
          {agents && <AgentsTable data={agents} />}
        </div>
      )}

      {currentTab === "customers" && (
        <div className="h-full">
          {customers && <CustomersTable data={customers} />}
        </div>
      )}

      {currentTab === "embed" && (
        <div className="h-full">
          <EmbedSettings />
        </div>
      )}

      {currentTab === "settings" && (
        <div className="h-full">
          <SettingsPanel />
        </div>
      )}
    </div>
  );
}