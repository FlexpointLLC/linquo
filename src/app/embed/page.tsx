"use client";
import { useEffect, useMemo, useState, Suspense, useRef } from "react";
import { X } from "lucide-react";
import { type ChatMessage } from "@/components/chat/message-thread";
import { CustomerForm } from "@/components/widget/customer-form";
import { useSearchParams } from "next/navigation";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import type { DbMessage as WidgetDbMessage } from "@/hooks/useRealtimeMessages";
import { useCustomer } from "@/hooks/useCustomer";
import { CustomerData } from "@/lib/customer-data-collector";
import { useBrandColor } from "@/contexts/brand-color-context";
import { useTypingIndicator } from "@/hooks/useTypingIndicator";
import { ErrorBoundary } from "@/components/error-boundary";

function EmbedContent() {
  const params = useSearchParams();
  const { brandColor, chatHeaderName, chatHeaderSubtitle } = useBrandColor();
  const [site, setSite] = useState<string>("");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [cid, setCid] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);
  const [, setWidgetColor] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const baseTitleRef = useRef<string>('Linquo');

  const { customer, loading, createOrGetCustomer, createOrGetCustomerWithOrgId, createConversation } = useCustomer();
  const { data: messageRows, isConnected: realtimeConnected } = useRealtimeMessages(cid);
  const { typingUsers, handleTypingStart, handleTypingStop } = useTypingIndicator(
    cid, 
    customer?.id || '', 
    'customer'
  );

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set site and orgId after hydration
  useEffect(() => {
    if (!isHydrated) return;
    
    const siteParam = params.get("site");
    const orgParam = params.get("org");
    const colorParam = params.get("color");
    
    console.log("🔍 URL parameters:", { siteParam, orgParam, colorParam });
    
    if (siteParam) {
      setSite(siteParam);
    } else if (typeof window !== 'undefined') {
      setSite(window.location.origin);
    }
    
    if (orgParam) {
      console.log("✅ Setting orgId from URL parameter:", orgParam);
      setOrgId(orgParam);
    } else {
      console.log("❌ No orgId found in URL parameters");
    }
    
    if (colorParam) {
      console.log("🎨 Setting brand color from URL parameter:", colorParam);
      setWidgetColor(colorParam);
    }
  }, [params, isHydrated]);

  // Notify parent page (widget.js) to update tab title when agent sends a new message
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!cid || !messageRows || messageRows.length === 0) {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'widget-clear-unread' }, '*');
      }
      return;
    }
    const last = messageRows[messageRows.length - 1] as WidgetDbMessage;
    if (last?.sender_type === 'AGENT') {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'widget-new-message' }, '*');
      }
    } else {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ type: 'widget-clear-unread' }, '*');
      }
    }
  }, [cid, messageRows]);

  // Widget tab title: show New Message when latest is an agent reply
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const base = baseTitleRef.current;
    if (!cid || !messageRows || messageRows.length === 0) {
      document.title = base;
      return;
    }
    const last = messageRows[messageRows.length - 1] as WidgetDbMessage;
    if (last?.sender_type === 'AGENT') {
      document.title = `New Message - ${base}`;
    } else {
      document.title = base;
    }
  }, [cid, messageRows]);

  // Auto-scroll to bottom when new messages arrive or typing indicator changes
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  }, [messageRows, typingUsers]);

  // Check if customer exists and load existing conversation
  useEffect(() => {
    if (!customer) {
      setShowForm(true);
      return;
    }
    
    // Customer exists, check if they have an existing conversation
    const loadExistingConversation = async () => {
      try {
        const client = (await import("@/lib/supabase/client")).createClient();
        if (!client) return;
        
        // Check for existing conversation
        const { data: existingConv, error } = await client
          .from("conversations")
          .select("id")
          .eq("customer_id", customer.id)
          .maybeSingle();
        
        if (error) {
          return;
        }
        
        if (existingConv) {
          setCid(existingConv.id);
        } else {
          // Create a new conversation immediately so the first message can send
          const newId = await createConversation(customer);
          if (newId) {
            setCid(newId);
          }
        }
      } catch {
        // Error loading existing conversation
      }
    };
    
    loadExistingConversation();
  }, [customer, createConversation]);

  const handleCustomerSubmit = async (data: { name: string; email: string; customerData?: CustomerData }) => {
    try {
      console.log("🚀 Starting customer creation:", { name: data.name, email: data.email, site, orgId });
      console.log("🔍 Site parameter details:", {
        site: site,
        siteType: typeof site,
        siteLength: site?.length,
        isLocalhost: site?.includes('localhost')
      });
      console.log("🔍 Using method:", orgId ? "createOrGetCustomerWithOrgId" : "createOrGetCustomer");
      
      // If we have an orgId from the widget, use it directly
      // Otherwise fall back to the old method using site/website
      const newCustomer = orgId 
        ? await createOrGetCustomerWithOrgId(data.name, data.email, orgId, data.customerData)
        : await createOrGetCustomer(data.name, data.email, site);
      
      console.log("✅ Customer created/found:", newCustomer);
      console.log("🔍 Customer details:", {
        id: newCustomer?.id,
        name: newCustomer?.display_name,
        email: newCustomer?.email,
        org_id: newCustomer?.org_id,
        status: newCustomer?.status
      });
      
      if (newCustomer) {
        console.log("🔄 Customer creation successful, hiding form...");
        console.log("🔍 New customer object:", newCustomer);
        setShowForm(false);
        
        // Create conversation for this customer
        console.log("🔄 Creating conversation for customer:", newCustomer.id);
        const conversationId = await createConversation(newCustomer);
        console.log("✅ Conversation created:", conversationId);
        
        if (conversationId) {
          console.log("🔄 Setting conversation ID:", conversationId);
          setCid(conversationId);
          console.log("✅ Widget state updated - should show chat interface now");
        } else {
          console.log("❌ Failed to create conversation, but customer was created");
          // Still show the chat interface even if conversation creation fails
          setShowForm(false);
        }
      } else {
        console.log("❌ Failed to create customer - newCustomer is null/undefined");
        // Don't change the form state if customer creation fails
      }
    } catch (error) {
      console.error("❌ Error in handleCustomerSubmit:", error);
      console.error("❌ Error details:", error);
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Don't change the form state if there's an error
    }
  };

  // Process messages for display
  const processedMessages = useMemo(() => {
    console.log("🔍 Widget message processing:", { messageRows, cid, messageCount: messageRows?.length });
    
    if (!messageRows || !cid) {
      console.log("❌ No messages or cid:", { messageRows, cid });
      return [];
    }
    
    // Check for duplicate message IDs
    const messageIds = messageRows.map(m => m.id);
    const uniqueIds = new Set(messageIds);
    if (messageIds.length !== uniqueIds.size) {
      console.warn("⚠️ Duplicate message IDs detected:", messageIds);
    }
    
    const processedMessages = messageRows.map((m: { id: string; sender_type: string; body_text: string; created_at: string }) => ({
      id: m.id,
      author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
      name: m.sender_type === "AGENT" ? "Agent" : "Customer",
      text: m.body_text,
      time: new Date(m.created_at).toLocaleTimeString(),
    }));
    
    console.log("✅ Processed messages:", processedMessages);
    return processedMessages;
  }, [messageRows, cid]);

  // Show nothing during hydration
  if (!isHydrated) {
    return null;
  }

  if (showForm) {
    return (
      <div className="h-full w-full">
        <CustomerForm onSubmit={handleCustomerSubmit} loading={loading} />
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full bg-white text-gray-900 flex flex-col" 
      data-widget-container
    >
      {/* Header - Fixed height */}
      <div className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200 p-2 sm:p-3 flex items-center justify-between" style={{ height: '60px' }}>
        <div className="flex items-center gap-3">
          <button 
            className="text-gray-600 hover:text-gray-800 cursor-pointer"
            onClick={() => setShowForm(true)}
            title="Back to form"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-white text-sm font-medium">S</span>
            </div>
            <div 
              className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${realtimeConnected ? 'bg-green-400' : 'bg-red-400'}`}
              title={realtimeConnected ? 'Connected' : 'Disconnected'}
            ></div>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">{chatHeaderName}</div>
            <div className="text-xs text-gray-500">
              <span>
                {realtimeConnected ? 'Active now' : chatHeaderSubtitle}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-600 hover:text-gray-800 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          <button 
            className="text-gray-600 hover:text-gray-800 cursor-pointer"
            onClick={() => {
              console.log("🔴 Close button clicked");
              // Send message to parent window to close the widget
              if (window.parent && window.parent !== window) {
                console.log("🔴 Sending close-widget message to parent");
                window.parent.postMessage({ type: 'close-widget' }, '*');
              } else {
                console.log("🔴 No parent window found or same window");
              }
            }}
            title="Close widget"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Message Body - Fill the whole middle space */}
      <div className="overflow-y-auto px-3 sm:px-4 pt-4 sm:pt-6 pb-4 sm:pb-6 flex-1">
        <div className="space-y-4">
          {/* Hardcoded welcome messages */}
          <div className="flex items-start gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-white text-sm font-medium">P</span>
            </div>
            <div className="bg-gray-100 text-gray-900 rounded-lg p-3 max-w-xs">
              <div className="text-sm break-words overflow-wrap-anywhere">
                Please share your email with us in case we can&apos;t get back to you right away.
              </div>
              <div className="text-xs text-gray-500 mt-1">Agent · 2:30 PM</div>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: brandColor }}
            >
              <span className="text-white text-sm font-medium">P</span>
            </div>
            <div className="bg-gray-100 text-gray-900 rounded-lg p-3 max-w-xs">
              <div className="text-sm break-words overflow-wrap-anywhere">
                Hello there! How can we help?
              </div>
              <div className="text-xs text-gray-500 mt-1">Agent · 2:31 PM</div>
            </div>
          </div>

          {/* Dynamic messages from database */}
          {processedMessages.length > 0 ? (
            <div className="space-y-4">
              {processedMessages.map((message, index) => (
                <div key={`${message.id}-${index}`} className={`flex items-start gap-3 ${message.author === 'customer' ? 'justify-end' : ''}`}>
                  {message.author === 'agent' && (
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-white text-sm font-medium">P</span>
                    </div>
                  )}
                  <div 
                    className={`rounded-lg p-3 max-w-xs ${
                      message.author === 'agent' 
                        ? 'bg-gray-100 text-gray-900' 
                        : 'text-white'
                    }`}
                    style={message.author === 'customer' ? { backgroundColor: brandColor } : {}}
                  >
                    <div className="text-sm whitespace-pre-wrap break-words overflow-wrap-anywhere">{message.text}</div>
                    <div className={`text-xs mt-1 ${message.author === 'agent' ? 'text-gray-500' : 'text-white opacity-80'}`}>
                      {message.author === 'agent' ? 'Agent' : 'You'} · {message.time}
                    </div>
                  </div>
                  {message.author === 'customer' && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600 text-sm font-medium">Y</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 text-sm py-4">
              {cid ? "" : "Conversation will start when you send a message."}
            </div>
          )}

          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: brandColor }}
              >
                <span className="text-white text-sm font-medium">A</span>
              </div>
              <div className="bg-gray-100 text-gray-900 rounded-lg p-3 max-w-xs">
                <div className="text-sm italic break-words overflow-wrap-anywhere">
                  {typingUsers.map(user => user.name).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Footer - Stay at the bottom */}
      <div className="border-t border-gray-200 bg-white bg-opacity-80 backdrop-blur-sm p-2 sm:p-3 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (e.target.value.trim()) {
                handleTypingStart();
              } else {
                handleTypingStop();
              }
            }}
            className="w-full pl-8 sm:pl-10 pr-16 sm:pr-20 py-2 sm:py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent break-words overflow-wrap-anywhere text-sm sm:text-base"
            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const text = inputValue.trim();
                if (text) {
                  // Stop typing indicator
                  handleTypingStop();
                  
                  // Send message logic
                  const sendMessage = async () => {
                    const client = (await import("@/lib/supabase/client")).createClient();
                    if (!client || !customer) {
                      return;
                    }
                    // Ensure conversation exists
                    let convId = cid;
                    if (!convId) {
                      convId = await createConversation(customer);
                      if (convId) setCid(convId);
                      else return;
                    }
                    
                    try {
                      console.log("🚀 Sending message:", { conversation_id: cid, customer_id: customer.id, org_id: customer.org_id, text });
                      
                      const { data: messageData, error: messageError } = await client.from("messages").insert({ 
                        conversation_id: convId, 
                        sender_type: "CUSTOMER",
                        customer_id: customer.id,
                        org_id: customer.org_id,
                        body_text: text
                      }).select().single();
                      
                      if (messageError) {
                        console.log("❌ Error sending message:", messageError);
                      } else {
                        console.log("✅ Message sent successfully:", messageData);
                        
                        // Update conversation last_message_at
                        const { error: updateError } = await client.from("conversations").update({ 
                          last_message_at: new Date().toISOString() 
                        }).eq("id", convId);
                        
                        if (updateError) {
                          console.log("❌ Error updating conversation:", updateError);
                        } else {
                          console.log("✅ Conversation updated successfully");
                        }

                        // Increment unread count for agents (if column exists)
                        try {
                          const { error: unreadError } = await client
                            .from("customers")
                            .update({ 
                              unread_count_agent: (customer.unread_count_agent || 0) + 1
                            })
                            .eq("id", customer.id)
                            .eq("org_id", customer.org_id);

                          if (unreadError) {
                            console.log("❌ Error updating unread count:", unreadError);
                          } else {
                            console.log("✅ Unread count incremented for agents");
                          }
                        } catch {
                          console.log("⚠️ Unread count column may not exist yet, skipping unread count update");
                        }
                        
                        console.log("🔄 Message sent successfully, should appear in chat now");
                      }
                    } catch (sendError) {
                      console.log("❌ Exception sending message:", sendError);
                    }
                  };
                  sendMessage();
                  setInputValue("");
                }
              }
            }}
          />
          
          {/* Emoji button */}
          <button className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Send button */}
          <button
            onClick={() => {
              const text = inputValue.trim();
              if (text) {
                // Stop typing indicator
                handleTypingStop();
                
                // Send message logic
                const sendMessage = async () => {
                  const client = (await import("@/lib/supabase/client")).createClient();
                  if (!client || !customer) {
                    return;
                  }
                  // Ensure conversation exists
                  let convId = cid;
                  if (!convId) {
                    convId = await createConversation(customer);
                    if (convId) setCid(convId);
                    else return;
                  }
                  
                  try {
                    const { error: messageError } = await client.from("messages").insert({ 
                      conversation_id: convId, 
                      sender_type: "CUSTOMER",
                      customer_id: customer.id,
                      org_id: customer.org_id,
                      body_text: text
                    }).select().single();
                    
                    if (!messageError) {
                      // Update conversation last_message_at
                      await client.from("conversations").update({ 
                        last_message_at: new Date().toISOString() 
                      }).eq("id", convId);

                      // Increment unread count for agents (if column exists)
                      try {
                        await client
                          .from("customers")
                          .update({ 
                            unread_count_agent: (customer.unread_count_agent || 0) + 1
                          })
                          .eq("id", customer.id)
                          .eq("org_id", customer.org_id);
                      } catch {
                        console.log("⚠️ Unread count column may not exist yet, skipping unread count update");
                      }
                      
                      // Force refresh messages to ensure they appear immediately
                      console.log("🔄 Message sent successfully, should appear in chat now");
                    }
                  } catch {
                    // Error sending message
                  }
                };
                sendMessage();
                setInputValue("");
              }
            }}
            disabled={!inputValue.trim()}
            className={`absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-colors ${
              inputValue.trim() 
                ? 'cursor-pointer' 
                : 'bg-gray-100 cursor-not-allowed'
            }`}
            style={inputValue.trim() ? { backgroundColor: brandColor } : {}}
          >
            <svg className={`w-3 h-3 sm:w-4 sm:h-4 ${inputValue.trim() ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <EmbedContent />
      </Suspense>
    </ErrorBoundary>
  );
}