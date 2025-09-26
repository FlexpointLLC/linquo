"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useMemo, memo, useRef, useCallback } from "react";
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
import { useCustomerDetails } from "@/hooks/useCustomerDetails";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Check, RotateCcw, Loader2, Info, X, MapPin, Monitor, Activity, Globe, FileText, ChevronRight, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { OptimizedSettings } from "@/components/settings/optimized-settings";

export const DashboardContent = memo(function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentTab, setCurrentTab] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get("tab") ?? "chats";
    }
    return "chats";
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [resolvingConversationId, setResolvingConversationId] = useState<string | null>(null);
  const [isInfoSidebarOpen, setIsInfoSidebarOpen] = useState(false);
  const [isMobileInfoModalOpen, setIsMobileInfoModalOpen] = useState(false);
  const [showMobileMessageView, setShowMobileMessageView] = useState(false);
  const [detailedCustomerData, setDetailedCustomerData] = useState<{
    id: string;
    display_name: string;
    email: string;
    status: string;
    country?: string;
    region?: string;
    city?: string;
    timezone?: string;
    browser_name?: string;
    browser_version?: string;
    os_name?: string;
    os_version?: string;
    device_type?: string;
    language?: string;
    is_returning?: boolean;
    total_visits?: number;
    last_visit?: string;
    current_url?: string;
    referrer_url?: string;
  } | null>(null);

  useEffect(() => {
    const tab = searchParams.get("tab") ?? "chats";
    const cid = searchParams.get("cid");
    setCurrentTab(tab);
    setActiveId(cid);
    
    // Show mobile message view when a conversation is selected
    if (tab === "chats" && cid) {
      setShowMobileMessageView(true);
    } else {
      setShowMobileMessageView(false);
    }
  }, [searchParams]);

  // Get section parameter for chat sub-tabs
  const section = searchParams.get("section") || "open";

  // Handle section change for chat sub-tabs
  const handleSectionChange = (newSection: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("section", newSection);
    // Preserve other parameters
    const cid = searchParams.get("cid");
    if (cid) {
      url.searchParams.set("cid", cid);
    }
    router.push(url.pathname + "?" + url.searchParams.toString());
  };

  const handleBackToConversations = () => {
    console.log("🔙 Mobile back button clicked - going to conversation list");
    // For mobile: go to conversation list with no conversation selected
    router.push("/dashboard?tab=chats");
  };

  const { data: conversationRows, error: conversationError, resetUnreadCount } = useConversations();
  const { data: messageRows, error: messageError, markMessagesAsRead, refresh } = useMessages(currentTab === "chats" ? activeId : null);
  
  // Memoize conversation IDs to prevent infinite loops
  const conversationIds = useMemo(() => 
    conversationRows?.map(c => c.id) || [], 
    [conversationRows]
  );
  const { data: lastMessages } = useLastMessages(conversationIds);

  const { agents, customers } = useDataCache();
  const { agent } = useAuth();
  const { getCustomerDetails, loading: customerDetailsLoading } = useCustomerDetails();

  // --- Notification sound when any conversation becomes unread (blue border) ---
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canPlayRef = useRef<boolean>(false);
  const prevUnreadMapRef = useRef<Record<string, number>>({});

  // Initialize AudioContext on first user interaction to satisfy autoplay policies
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const init = async () => {
      try {
        const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        if (!audioCtxRef.current) audioCtxRef.current = new AC();
        if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();
        canPlayRef.current = true;
      } catch {}
    };
    const onInteract = () => { init(); };
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteract as EventListener);
      window.removeEventListener('keydown', onInteract as EventListener);
    };
  }, []);

  const playNotificationBeep = useCallback(async () => {
    if (typeof window === 'undefined') return;
    try {
      const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!audioCtxRef.current) {
        if (!canPlayRef.current) return;
        audioCtxRef.current = new AC();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1200;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.24);
    } catch {}
  }, []);

  // Watch conversations unread counts; play when any goes from 0 -> >0 (blue border appears)
  useEffect(() => {
    if (!conversationRows) return;
    const prevMap = prevUnreadMapRef.current;
    for (const conv of conversationRows) {
      const prev = prevMap[conv.id] ?? 0;
      const curr = conv.unread ?? 0;
      if (prev === 0 && curr > 0) {
        // Optional: avoid beeping for the currently open conversation; it typically won't have unread
        if (conv.id !== activeId) {
          playNotificationBeep();
        }
      }
      prevMap[conv.id] = curr;
    }
    prevUnreadMapRef.current = prevMap;
  }, [conversationRows, activeId, playNotificationBeep]);

  // Update browser tab title when any conversation has unread
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseTitle = 'Linquo';
    const hasUnread = (conversationRows ?? []).some(c => (c.unread || 0) > 0);
    document.title = hasUnread ? `New Message - ${baseTitle}` : baseTitle;
    return () => {
      document.title = baseTitle;
    };
  }, [conversationRows]);

  // Fetch detailed customer data when info sidebar or mobile modal opens
  useEffect(() => {
    if ((isInfoSidebarOpen || isMobileInfoModalOpen) && activeId) {
      const conversation = conversationRows?.find(c => c.id === activeId);
      if (conversation?.customer_id) {
        console.log("🔍 Fetching detailed customer data for:", conversation.customer_id);
        getCustomerDetails(conversation.customer_id).then((data) => {
          if (data) {
            console.log("✅ Detailed customer data loaded:", data);
            setDetailedCustomerData(data);
          } else {
            console.log("❌ Failed to load detailed customer data");
            setDetailedCustomerData(null);
          }
        });
      }
    } else {
      setDetailedCustomerData(null);
    }
  }, [isInfoSidebarOpen, isMobileInfoModalOpen, activeId, conversationRows, getCustomerDetails]);

  // Refresh messages when switching conversations to ensure read status is up-to-date
  useEffect(() => {
    if (activeId && refresh) {
      console.log("🔄 Conversation changed, refreshing messages for:", activeId);
      refresh();
    }
  }, [activeId, refresh]);

  // Mark customer messages as read when conversation is viewed
  useEffect(() => {
    if (activeId && messageRows && markMessagesAsRead && resetUnreadCount) {
      const unreadCustomerMessages = messageRows
        .filter(m => m.sender_type === "CUSTOMER" && m.read_by_agent === false)
        .map(m => m.id);
      
      if (unreadCustomerMessages.length > 0) {
        console.log("📖 Marking customer messages as read:", unreadCustomerMessages.length);
        markMessagesAsRead();
        resetUnreadCount(activeId); // Optimistically update unread count
      }
    }
  }, [activeId, messageRows, markMessagesAsRead, resetUnreadCount]);

  // Get unread count from customer data

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
      
      const supabase = createClient();
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



  // Auto-select first conversation if none is selected (desktop only)
  useEffect(() => {
    if (currentTab === "chats" && !activeId && conversationRows && conversationRows.length > 0) {
      // Only auto-select on desktop, not on mobile
      const isDesktop = window.innerWidth >= 768; // md breakpoint
      if (isDesktop) {
        const firstConversationId = conversationRows[0].id;
        const url = new URL(window.location.href);
        url.searchParams.set("cid", firstConversationId);
        router.push(url.pathname + "?" + url.searchParams.toString());
      }
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
          className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-[calc(100vh-80px)] -m-6"
          style={{ overflow: 'hidden' }}
        >
              <div className={`${showMobileMessageView ? 'hidden md:block' : 'block w-full md:w-auto'}`}>
                <ConversationList
                    conversations={(conversationRows ?? []).map((c) => {
                      const lastMessage = lastMessages?.find(m => m.conversation_id === c.id);
                  
                  return {
                    id: c.id,
                    name: c.customers?.display_name || c.customers?.email || "Unknown Customer",
                    email: c.customers?.email,
                        lastMessage: c.last_body_text || lastMessage?.body_text || "No messages yet",
                    unread: c.unread ?? 0, // Use nullish coalescing instead of logical OR
                    status: "ACTIVE" as const,
                    state: c.state || "OPEN",
                    timestamp: c.last_message_at ? new Date(c.last_message_at).toLocaleDateString() : undefined,
                    created_at: c.created_at
                  };
                })}
                activeId={activeId ?? undefined}
                section={section}
                onSectionChange={handleSectionChange}
                onSelect={(id) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("cid", id);
                  url.searchParams.set("tab", currentTab); // Preserve current tab
                  url.searchParams.set("section", section); // Preserve current section
                  router.push(url.pathname + "?" + url.searchParams.toString());
                }}
              />
              </div>

          <div className={`flex flex-col h-[calc(100vh-80px)] bg-background pt-0 pb-0 ${showMobileMessageView && activeId ? 'block' : 'hidden md:block'}`}>
            {/* Conversation Header with Actions */}
            {activeId && (
              <div className="border-b p-3 bg-background flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Show back button on mobile when message view is active, otherwise show avatar */}
                    {showMobileMessageView ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToConversations}
                        className="md:hidden h-8 w-8 p-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    ) : null}
                    
                    <Avatar className={`h-8 w-8 ${showMobileMessageView ? 'hidden md:block' : 'block'}`}>
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
                            onClick={() => {
                              // Check if mobile (screen width < 768px)
                              const isMobile = window.innerWidth < 768;
                              if (isMobile) {
                                setIsMobileInfoModalOpen(!isMobileInfoModalOpen);
                              } else {
                                setIsInfoSidebarOpen(!isInfoSidebarOpen);
                              }
                            }}
                          >
                            {(isInfoSidebarOpen || isMobileInfoModalOpen) ? (
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
                          read_by_agent: m.read_by_agent,
                          read_at: m.read_at,
                        };
                      }) as ChatMessage[]}
                      typingUsers={dashboardTypingUsers}
                    />
                  ) : (
                    // Show InstallationGuide only on desktop, nothing on mobile
                    <div className="hidden md:block">
                      <InstallationGuide />
                    </div>
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

                        const client = (await import("@/lib/supabase/client")).createClient();
                        if (!client) {
                          console.log("❌ Supabase client not available");
                          return;
                        }

                        try {
                          console.log("📝 Inserting message to Supabase...");
                          const { data: messageData, error: messageError } = await client.from("messages").insert({
                            conversation_id: activeId,
                            sender_type: "AGENT",
                            agent_id: agent.id,
                            org_id: agent.org_id,
                            body_text: text,
                          }).select().single();

                          if (messageError) {
                            console.log("❌ Error inserting message:", messageError);
                            toast.error("Failed to send message");
                            return;
                          }

                          console.log("✅ Message inserted successfully:", messageData?.id);
                          
                          // Update conversation timestamp
                          const { error: conversationError } = await client
                            .from("conversations")
                            .update({ last_message_at: new Date().toISOString() })
                            .eq("id", activeId);
                          
                          if (conversationError) {
                            console.log("⚠️ Error updating conversation timestamp:", conversationError);
                          } else {
                            console.log("✅ Conversation timestamp updated");
                          }

                          // Success UI feedback removed per request
                        } catch (error) {
                          console.log("❌ Error sending message:", error);
                          toast.error("Failed to send message");
                        }
                      }}
                    />
                  </div>
                )}
              </div>
              
              {/* Info Sidebar */}
              {isInfoSidebarOpen && activeId && (
                <div className="w-auto md:w-80 border-l border-border bg-background overflow-y-auto">
                  <div className="p-4 w-auto">
                    {(() => {
                      const conversation = conversationRows?.find(c => c.id === activeId);
                      const customer = customers?.find(c => c.id === conversation?.customer_id);
                      
                      if (!customer) return null;

                      // Show loading state while fetching detailed customer data
                      if (customerDetailsLoading && !detailedCustomerData) {
                        return (
                          <div className="flex items-center justify-center h-32">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Loading customer details...</span>
                          </div>
                        );
                      }

                      // Use detailed customer data if available, otherwise fall back to basic customer data
                      const customerData = detailedCustomerData || customer;

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
                                {customerData.display_name?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="text-lg font-semibold text-foreground">{customerData.display_name || "Unknown"}</div>
                              <div className="text-sm text-muted-foreground truncate max-w-[200px]">{customerData.email || "No email"}</div>
                            </div>
                          </div>

                          {/* Location */}
                          <Section title="Location" icon={MapPin}>
                            {(customerData.city || customerData.region || customerData.country) ? (
                              <>
                                <div className="flex items-start justify-between py-1 gap-4">
                                  <span className="text-muted-foreground flex-shrink-0">Place</span>
                                  <span className="text-foreground font-medium text-right break-words">{[customerData.city, customerData.region, customerData.country].filter(Boolean).join(', ')}</span>
                                </div>
                                {customerData.timezone && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Timezone</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.timezone}</span>
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
                            {(customerData.browser_name || customerData.os_name || customerData.device_type || customerData.language) ? (
                              <>
                                {customerData.browser_name && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Browser</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.browser_name}{customerData.browser_version ? ` ${customerData.browser_version}` : ''}</span>
                                  </div>
                                )}
                                {customerData.os_name && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">OS</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.os_name}{customerData.os_version ? ` ${customerData.os_version}` : ''}</span>
                                  </div>
                                )}
                                {customerData.device_type && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Device</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.device_type}</span>
                                  </div>
                                )}
                                {customerData.language && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Language</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.language}</span>
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
                            {(typeof customerData.is_returning !== 'undefined' || typeof customerData.total_visits !== 'undefined' || customerData.last_visit) ? (
                              <>
                                {typeof customerData.is_returning !== 'undefined' && (
                                  <div className="flex items-center justify-between py-1">
                                    <span className="text-muted-foreground">Visitor</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${customerData.is_returning ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                                      {customerData.is_returning ? 'Returning' : 'New'}
                                    </span>
                                  </div>
                                )}
                                {typeof customerData.total_visits !== 'undefined' && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Total visits</span>
                                    <span className="text-foreground font-medium text-right break-words">{customerData.total_visits}</span>
                                  </div>
                                )}
                                {customerData.last_visit && (
                                  <div className="flex items-start justify-between py-1 gap-4">
                                    <span className="text-muted-foreground flex-shrink-0">Last visit</span>
                                    <span className="text-foreground font-medium text-right break-words">{new Date(customerData.last_visit).toLocaleDateString()}</span>
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
                            {customerData.referrer_url ? (
                              <div className="space-y-2">
                                <div className="text-muted-foreground text-xs">Referrer</div>
                                <a className="text-primary hover:underline text-sm block truncate" href={customerData.referrer_url} target="_blank" rel="noreferrer">
                                  {customerData.referrer_url}
                                </a>
                              </div>
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

      {/* Mobile Info Modal */}
      {isMobileInfoModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setIsMobileInfoModalOpen(false)}
          />
          
          {/* Bottom Sheet Modal */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-lg border-t border-border max-h-[80vh] flex flex-col animate-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Customer Information</h2>
              <button 
                onClick={() => setIsMobileInfoModalOpen(false)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {/* Content - Match desktop sidebar exactly */}
            <div className="overflow-y-auto flex-1">
              <div className="p-4 w-auto">
            {(() => {
              const conversation = conversationRows?.find(c => c.id === activeId);
              const customer = customers?.find(c => c.id === conversation?.customer_id);
              
              if (!customer) return null;

              // Show loading state while fetching detailed customer data
              if (customerDetailsLoading && !detailedCustomerData) {
                return (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    <span className="ml-2 text-sm text-muted-foreground">Loading customer details...</span>
                  </div>
                );
              }

              // Use detailed customer data if available, otherwise fall back to basic customer data
              const customerData = detailedCustomerData || customer;

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
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-4 pb-4 space-y-3 text-sm">
                    {children}
                  </div>
                </details>
              );

              return (
                <div className="space-y-1">
                  {/* Header - Match desktop sidebar exactly */}
                  <div className="flex flex-col items-center text-center gap-3 pb-6 border-b border-border/50">
                    <Avatar className="h-20 w-20 ring-2 ring-muted/20">
                      <AvatarFallback className="text-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                        {customerData.display_name?.[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-xl font-bold text-foreground">{customerData.display_name}</h2>
                      <p className="text-sm text-muted-foreground">{customerData.email}</p>
                      <div className="flex items-center justify-center gap-2 mt-2">
                        <div className={`w-2 h-2 rounded-full ${customerData.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <span className="text-xs text-muted-foreground capitalize">{customerData.status}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location */}
                  {(customerData.country || customerData.region || customerData.city) && (
                    <Section title="Location" icon={MapPin}>
                        {customerData.city && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">City</span>
                            <span className="text-foreground font-medium text-right break-words">{customerData.city}</span>
                          </div>
                        )}
                        {customerData.region && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Region</span>
                            <span className="text-foreground font-medium text-right break-words">{customerData.region}</span>
                          </div>
                        )}
                        {customerData.country && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Country</span>
                            <span className="text-foreground font-medium text-right break-words">{customerData.country}</span>
                          </div>
                        )}
                        {customerData.timezone && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Timezone</span>
                            <span className="text-foreground font-medium text-right break-words">{customerData.timezone}</span>
                          </div>
                        )}
                    </Section>
                  )}

                  {/* Device & Browser */}
                  {(customerData.browser_name || customerData.os_name || customerData.device_type) && (
                    <Section title="Device & Browser" icon={Monitor}>
                        {customerData.browser_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Browser</span>
                            <span className="text-foreground font-medium text-right break-words">
                              {customerData.browser_name} {customerData.browser_version}
                            </span>
                          </div>
                        )}
                        {customerData.os_name && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Operating System</span>
                            <span className="text-foreground font-medium text-right break-words">
                              {customerData.os_name} {customerData.os_version}
                            </span>
                          </div>
                        )}
                        {customerData.device_type && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Device Type</span>
                            <span className="text-foreground font-medium text-right break-words capitalize">{customerData.device_type}</span>
                          </div>
                        )}
                        {customerData.language && (
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground flex-shrink-0">Language</span>
                            <span className="text-foreground font-medium text-right break-words">{customerData.language}</span>
                          </div>
                        )}
                    </Section>
                  )}

                  {/* Activity */}
                  <Section title="Activity" icon={Activity}>
                      {customerData.is_returning !== undefined && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex-shrink-0">Visitor Type</span>
                          <span className="text-foreground font-medium text-right break-words">
                            {customerData.is_returning ? 'Returning' : 'New'}
                          </span>
                        </div>
                      )}
                      {customerData.total_visits && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex-shrink-0">Total Visits</span>
                          <span className="text-foreground font-medium text-right break-words">{customerData.total_visits}</span>
                        </div>
                      )}
                      {customerData.last_visit && (
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground flex-shrink-0">Last Visit</span>
                          <span className="text-foreground font-medium text-right break-words">
                            {new Date(customerData.last_visit).toLocaleDateString()}
                          </span>
                        </div>
                        )}
                    </Section>

                  {/* Website Activity */}
                  {customerData.referrer_url && (
                    <Section title="Website Activity" icon={Globe}>
                        {customerData.referrer_url && (
                          <div className="space-y-2">
                            <div className="text-muted-foreground text-xs">Referrer</div>
                            <a className="text-primary hover:underline text-sm block truncate" href={customerData.referrer_url} target="_blank" rel="noreferrer">
                              {customerData.referrer_url}
                            </a>
                          </div>
                        )}
                    </Section>
                  )}

                  {/* Conversation Stats */}
                  <Section title="Conversation Stats" icon={FileText}>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex-shrink-0">Messages</span>
                        <span className="text-foreground font-medium text-right break-words">{messageRows?.length || 0}</span>
                      </div>
                  </Section>
                </div>
              );
            })()}
              </div>
            </div>
          </div>
        </>
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
        <OptimizedSettings />
      )}
    </div>
  );
});


export default DashboardContent;