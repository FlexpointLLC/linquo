"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { type ChatMessage } from "@/components/chat/message-thread";
import { CustomerForm } from "@/components/widget/customer-form";
import { useSearchParams } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { useCustomer } from "@/hooks/useCustomer";
import { ErrorBoundary } from "@/components/error-boundary";

function EmbedContent() {
  const params = useSearchParams();
  const site = params.get("site") || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const [cid, setCid] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const { customer, loading, createOrGetCustomer, createConversation, clearCustomer } = useCustomer();
  const { data: messageRows } = useMessages(cid);

  // Check if customer exists and load existing conversation
  useEffect(() => {
    if (!customer) {
      setShowForm(true);
      return;
    }
    
    // Customer exists, check if they have an existing conversation
    const loadExistingConversation = async () => {
      try {
        const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
        if (!client) return;
        
        // Check for existing conversation
        const { data: existingConv, error } = await client
          .from("conversations")
          .select("id")
          .eq("customer_id", customer.id)
          .maybeSingle();
        
        if (error) {
          console.error("❌ Error loading existing conversation:", error);
        } else if (existingConv) {
          console.log("✅ Found existing conversation:", existingConv.id);
          setCid(existingConv.id);
        }
      } catch (error) {
        console.error("❌ Error in loadExistingConversation:", error);
      }
    };
    
    setShowForm(false);
    loadExistingConversation();
  }, [customer]);

  const handleCustomerSubmit = async (data: { name: string; email: string }) => {
    console.log("🎯 Form submitted with data:", data, "for site:", site);
    try {
      const customerData = await createOrGetCustomer(data.name, data.email, site);
      console.log("📝 Customer creation result:", customerData);
      
      if (customerData) {
        console.log("✅ Customer created/found, creating or finding conversation");
        
        // Create or find conversation immediately when "Start Chat" is clicked
        const conversationId = await createConversation(customerData);
        if (conversationId) {
          console.log("✅ Conversation created/found:", conversationId);
          setCid(conversationId);
        } else {
          console.log("⚠️ Failed to create conversation, but showing chat view");
        }
        
        setShowForm(false);
      } else {
        // Failed to create/find customer - still show chat view
        console.log("⚠️ Failed to create customer, but showing chat view");
        setShowForm(false);
      }
    } catch {
      // Error in customer submit - still show chat view
      console.log("❌ Error occurred, but showing chat view");
      setShowForm(false);
    }
  };

  const messages = useMemo<ChatMessage[]>(() => {
    console.log("🔄 Processing messages:", { messageRows, cid });
    const processedMessages = (messageRows ?? []).map((m) => ({
      id: m.id,
      author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
      name: m.sender_type === "AGENT" ? "Agent" : "Customer",
      text: m.body_text,
      time: new Date(m.created_at).toLocaleTimeString(),
    }));
    console.log("✅ Processed messages:", processedMessages);
    return processedMessages;
  }, [messageRows, cid]);

  if (showForm) {
    return (
      <div className="h-full w-full bg-background text-foreground p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <div className="font-medium text-sm">Support</div>
          </div>
        </div>
        <CustomerForm onSubmit={handleCustomerSubmit} loading={loading} />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white text-gray-900 flex flex-col">
      {/* Header matching screenshot */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <button className="text-gray-600 hover:text-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">P</span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-semibold text-sm text-gray-900">Pearl</div>
            <div className="text-xs text-gray-500">Active 45m ago</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-gray-600 hover:text-gray-800">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
          <button 
            onClick={() => {
              clearCustomer();
              setShowForm(true);
              setCid(null);
            }}
            className="text-gray-600 hover:text-gray-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Messages area - fixed height */}
      <div className="h-[562px] overflow-hidden bg-white">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Initial prompt */}
            <div className="text-center text-gray-900 text-sm font-medium">
              Ask us anything, or share your feedback.
            </div>
            
            {/* Info bubble */}
            <div className="bg-gray-100 rounded-lg p-3 flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Please share your email with us in case we can&apos;t get back to you right away.
                </span>
              </div>
            </div>
            
            {/* Agent message bubble */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm text-gray-700">
                Hi there! 👋 Need help with our services? Just ask here and we&apos;ll assist you!
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pearl · 3w ago
              </div>
            </div>
            
            {/* Existing messages */}
            {messages.length > 0 ? (
              <div className="space-y-1">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.author === 'agent' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] ${message.author === 'agent' ? 'bg-gray-100 text-gray-900' : 'bg-blue-500 text-white'} rounded-lg px-3 py-2 inline-block`}>
                      <div className="text-sm whitespace-pre-wrap">{message.text}</div>
                      <div className={`text-xs mt-1 ${message.author === 'agent' ? 'text-gray-500' : 'text-blue-100'}`}>
                        {message.author === 'agent' ? 'Agent' : 'You'} · {message.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-4">
                {cid ? "No messages yet. Start the conversation!" : "Conversation will start when you send a message."}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Message input box - ALWAYS STICKY TO BOTTOM */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-3 sticky bottom-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Message..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full pl-10 pr-20 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const text = inputValue.trim();
                if (text) {
                  // Send message logic
                  console.log("💬 Sending message:", { text, cid, customer: customer?.id });
                  const sendMessage = async () => {
                    const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                    if (!client || !customer || !cid) {
                      console.error("❌ Missing required data for message sending:", { client: !!client, customer: !!customer, cid });
                      return;
                    }
                    
                    try {
                      console.log("📝 Inserting message into database...");
                      const { data: messageData, error: messageError } = await client.from("messages").insert({ 
                        conversation_id: cid, 
                        sender_type: "CUSTOMER",
                        customer_id: customer.id,
                        org_id: customer.org_id,
                        body_text: text
                      }).select().single();
                      
                      if (messageError) {
                        console.error("❌ Error inserting message:", messageError);
                      } else {
                        console.log("✅ Message inserted successfully:", messageData);
                        console.log("🔄 Message should now appear in the chat!");
                      }
                      
                      console.log("🔄 Updating conversation last_message_at...");
                      const { error: updateError } = await client.from("conversations").update({ 
                        last_message_at: new Date().toISOString() 
                      }).eq("id", cid);
                      
                      if (updateError) {
                        console.error("❌ Error updating conversation:", updateError);
                      } else {
                        console.log("✅ Conversation updated successfully");
                      }
                    } catch (error) {
                      console.error("❌ Error in message sending:", error);
                    }
                  };
                  sendMessage();
                  setInputValue("");
                }
              }
            }}
          />
          
          {/* Emoji icon on the left */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center">
            <button className="text-gray-400 hover:text-gray-600 flex items-center justify-center w-6 h-6">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
          
          {/* Send button on the right */}
          <button 
            onClick={() => {
              const text = inputValue.trim();
              if (text) {
                // Send message logic
                console.log("💬 Sending message:", { text, cid, customer: customer?.id });
                const sendMessage = async () => {
                  const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                  if (!client || !customer || !cid) {
                    console.error("❌ Missing required data for message sending:", { client: !!client, customer: !!customer, cid });
                    return;
                  }
                  
                  try {
                    console.log("📝 Inserting message into database...");
                    const { data: messageData, error: messageError } = await client.from("messages").insert({ 
                      conversation_id: cid, 
                      sender_type: "CUSTOMER",
                      customer_id: customer.id,
                      org_id: customer.org_id,
                      body_text: text
                    }).select().single();
                    
                    if (messageError) {
                      console.error("❌ Error inserting message:", messageError);
                    } else {
                      console.log("✅ Message inserted successfully:", messageData);
                      console.log("🔄 Message should now appear in the chat!");
                    }
                    
                    console.log("🔄 Updating conversation last_message_at...");
                    const { error: updateError } = await client.from("conversations").update({ 
                      last_message_at: new Date().toISOString() 
                    }).eq("id", cid);
                    
                    if (updateError) {
                      console.error("❌ Error updating conversation:", updateError);
                    } else {
                      console.log("✅ Conversation updated successfully");
                    }
                  } catch (error) {
                    console.error("❌ Error in message sending:", error);
                  }
                };
                sendMessage();
                setInputValue("");
              }
            }}
            disabled={!inputValue.trim()}
            className={`absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              inputValue.trim() 
                ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer' 
                : 'bg-gray-200 cursor-not-allowed'
            }`}
          >
            <svg className={`w-4 h-4 ${inputValue.trim() ? 'text-white' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      <Suspense fallback={<div className="h-full w-full bg-background flex items-center justify-center">Loading...</div>}>
        <EmbedContent />
      </Suspense>
    </ErrorBoundary>
  );
}


