"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, memo } from "react";
import { ConversationList } from "@/components/chat/conversation-list";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { Composer } from "@/components/chat/composer";
import dynamic from "next/dynamic";

// Lazy load heavy components
const AgentsTable = dynamic(() => import("@/components/tables/agents-table").then(mod => ({ default: mod.AgentsTable })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading agents...</div>
});

const CustomersTable = dynamic(() => import("@/components/tables/customers-table").then(mod => ({ default: mod.CustomersTable })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading customers...</div>
});

const SettingsPanel = dynamic(() => import("@/components/settings/settings-panel").then(mod => ({ default: mod.SettingsPanel })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading settings...</div>
});

const EmbedSettings = dynamic(() => import("@/components/embed/embed-settings").then(mod => ({ default: mod.EmbedSettings })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading embed settings...</div>
});

const InstallationGuide = dynamic(() => import("@/components/installation-guide").then(mod => ({ default: mod.InstallationGuide })), {
  loading: () => <div className="p-4 text-center text-muted-foreground">Loading installation guide...</div>
});
import { useDataCache } from "@/hooks/useDataCache";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useMessages";
import { useLastMessages } from "@/hooks/useLastMessages";
import { useAuth } from "@/hooks/useAuth";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
// import { useCustomerDetails } from "@/hooks/useCustomerDetails";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, RotateCcw, Loader2, Info, X, MapPin, Monitor, Activity, Globe, FileText, ChevronRight } from "lucide-react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { toast } from "sonner";

export const DashboardContent = memo(function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState("chats");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resolvingConversationId, setResolvingConversationId] = useState<string | null>(null);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);

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
  // const { getCustomerDetails, loading: customerDetailsLoading } = useCustomerDetails();

  // Typing indicator for dashboard
  const { typingUsers: dashboardTypingUsers } = useTypingIndicator(
    activeId || null,
    agent?.id || '',
    'agent'
  );

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
        <div 
          className="grid grid-cols-[320px_1fr] h-[calc(100vh-80px)] -m-6"
          style={{ overflow: 'hidden' }}
        >
              <ConversationList
                conversations={(conversationRows ?? []).map((c) => {
                  const lastMessage = lastMessages?.find(m => m.conversation_id === c.id);
                  
                  return {
                    id: c.id,
                    name: c.customers?.display_name || c.customers?.email || "Unknown Customer",
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
          <div className="flex flex-col h-[calc(100vh-80px)] bg-background pt-0 pb-0">
            {/* Conversation Header with Actions */}
            {activeId && (
              <div className="border-b p-3 bg-background flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                        {(() => {
                          const conversation = conversationRows?.find(c => c.id === activeId);
                          const customerName = conversation?.customers?.display_name || `Conversation ${activeId?.slice(0, 8)}`;
                          return customerName?.slice(0, 2).toUpperCase() || "U";
                        })()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
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
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer"
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-2 cursor-pointer"
                            onClick={() => setIsInfoSidebarOpen(!isInfoSidebarOpen)}
                          >
                            {isInfoSidebarOpen ? (
                              <>
                                <X className="h-4 w-4" />
                                Close
                              </>
                            ) : (
                              <>
                                <Info className="h-4 w-4" />
                                Info
                              </>
                            )}
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}
            <div className="flex-1 flex overflow-hidden bg-background">
              {/* Main Chat Area with Composer */}
              <div className="flex-1 flex flex-col">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto bg-background">
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
                      typingUsers={dashboardTypingUsers}
                    />
                  ) : (
                    <InstallationGuide />
                  )}
                </div>
                
                {/* Composer */}
                {activeId && (
                  <div className="border-t border-border p-4 bg-background flex-shrink-0">
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
              
              {/* Info Sidebar */}
              {isInfoSidebarOpen && activeId && (
                <div className="w-80 border-l border-border bg-background overflow-y-auto">
                  <div className="p-4">
                    {(() => {
                      const conversation = conversationRows?.find(c => c.id === activeId);
                      const customer = customers?.find(c => c.id === conversation?.customer_id);
                      
                      if (!customer) return null;

                      // Section helper with icons
                      const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) => (
                        <details className="group border-b border-border/50">
                          <summary className="flex items-center justify-between cursor-pointer list-none px-4 py-3 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 rounded-md bg-muted/50">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span className="text-sm font-medium text-foreground">{title}</span>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground group-open:rotate-90 transition-transform" />
                          </summary>
                          <div className="px-4 pb-4 space-y-3 text-sm">
                            {children}
                          </div>
                        </details>
                      );

                      return (
                        <div className="space-y-1">
                          {/* Header */}
                          <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-border/50">
                            <Avatar className="h-20 w-20 ring-2 ring-muted/20">
                              <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {customer.display_name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-lg font-semibold text-foreground">{customer.display_name || "Unknown"}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{customer.email || "No email"}</div>
                            </div>
                          </div>

                          {/* Location */}
                          <Section title="Location" icon={MapPin}>
                            {(customer.city || customer.region || customer.country) ? (
                              <>
                                <div className="flex items-start justify-between py-1 gap-4">
                                  <span className="text-muted-foreground flex-shrink-0">Place</span>
                                  <span className="text-foreground font-medium text-right break-words">{[customer.city, customer.region, customer.country].filter(Boolean).join(', ')}</span>
                                </div>
                                {customer.timezone && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Timezone</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.timezone}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <MapPin className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No location data available</p>
                              </div>
                            )}
                          </Section>

                          {/* Device */}
                          <Section title="Device" icon={Monitor}>
                            {(customer.browser_name || customer.os_name || customer.device_type || customer.language) ? (
                              <>
                                {customer.browser_name && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Browser</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.browser_name}{customer.browser_version ? ` ${customer.browser_version}` : ''}</span>
                                  </div>
                                )}
                                {customer.os_name && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">OS</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.os_name}{customer.os_version ? ` ${customer.os_version}` : ''}</span>
                                  </div>
                                )}
                                {customer.device_type && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Device</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.device_type}</span>
                                  </div>
                                )}
                                {customer.language && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Language</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.language}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <Monitor className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No device data available</p>
                              </div>
                            )}
                          </Section>

                          {/* Behavior */}
                          <Section title="Behavior" icon={Activity}>
                            {(typeof customer.is_returning !== 'undefined' || typeof customer.total_visits !== 'undefined' || customer.last_visit) ? (
                              <>
                                {typeof customer.is_returning !== 'undefined' && (
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Visitor</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${customer.is_returning ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                      {customer.is_returning ? 'Returning' : 'New'}
                                    </span>
                                  </div>
                                )}
                                {typeof customer.total_visits !== 'undefined' && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Total visits</span>
                                    <span className="text-foreground font-medium text-right break-words">{customer.total_visits}</span>
                                  </div>
                                )}
                                {customer.last_visit && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Last visit</span>
                                    <span className="text-foreground font-medium text-right break-words">{new Date(customer.last_visit).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <Activity className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No behavior data available</p>
                              </div>
                            )}
                          </Section>

                          {/* Pages Visited */}
                          <Section title="Pages Visited" icon={Globe}>
                            {(customer.current_url || customer.referrer_url) ? (
                              <>
                                {customer.current_url && (
                                  <div className="space-y-2">
                                    <div className="text-muted-foreground text-xs">Current page</div>
                                    <a className="text-primary hover:underline text-sm block truncate" href={customer.current_url} target="_blank" rel="noreferrer">
                                      {customer.current_url}
                                    </a>
                                  </div>
                                )}
                                {customer.referrer_url && (
                                  <div className="space-y-2">
                                    <div className="text-muted-foreground text-xs">Referrer</div>
                                    <a className="text-primary hover:underline text-sm block truncate" href={customer.referrer_url} target="_blank" rel="noreferrer">
                                      {customer.referrer_url}
                                    </a>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="text-center py-4">
                                <Globe className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">No page data available</p>
                              </div>
                            )}
                          </Section>

                          {/* Conversation Details */}
                          <Section title="Details" icon={FileText}>
                            <div className="flex items-center justify-between py-1">
                              <span className="text-muted-foreground">Status</span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${conversation?.state === 'CLOSED' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'}`}>
                                {conversation?.state === 'CLOSED' ? 'Resolved' : 'Open'}
                              </span>
                            </div>
                            <div className="flex items-start justify-between py-1 gap-4">
                              <span className="text-muted-foreground flex-shrink-0">Created</span>
                              <span className="text-foreground font-medium text-right break-words">{conversation?.created_at ? new Date(conversation.created_at).toLocaleDateString() : 'Unknown'}</span>
                            </div>
                            <div className="flex items-start justify-between py-1 gap-4">
                              <span className="text-muted-foreground flex-shrink-0">Messages</span>
                              <span className="text-foreground font-medium text-right break-words">{messageRows?.length || 0}</span>
                            </div>
                          </Section>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
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
});