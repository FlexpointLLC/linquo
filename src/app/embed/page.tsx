"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { MessageSquare, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Composer } from "@/components/chat/composer";
import { MessageThread, type ChatMessage } from "@/components/chat/message-thread";
import { CustomerForm } from "@/components/widget/customer-form";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { useCustomer } from "@/hooks/useCustomer";

function EmbedContent() {
  const params = useSearchParams();
  const site = params.get("site") || (typeof window !== 'undefined' ? window.location.hostname : 'localhost');
  const [cid, setCid] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { customer, loading, createOrGetCustomer, createConversation, clearCustomer } = useCustomer();
  const { data: messageRows } = useMessages(cid);

  // Check if customer exists and create conversation
  useEffect(() => {
    async function initializeCustomer() {
      if (!customer) {
        setShowForm(true);
        return;
      }

      // Create or get conversation for this customer
      const conversationId = await createConversation(customer);
      if (conversationId) {
        setCid(conversationId);
        setShowForm(false);
      }
    }

    initializeCustomer();
  }, [customer, createConversation]);

  const handleCustomerSubmit = async (data: { name: string; email: string }) => {
    console.log("🎯 Form submitted with data:", data, "for site:", site);
    try {
      const customerData = await createOrGetCustomer(data.name, data.email, site);
      console.log("📝 Customer creation result:", customerData);
      
      if (customerData) {
        console.log("✅ Customer created/found, creating conversation...");
        const conversationId = await createConversation(customerData);
        console.log("💬 Conversation creation result:", conversationId);
        
        if (conversationId) {
          console.log("✅ Conversation created/found, switching to chat view");
          setCid(conversationId);
          setShowForm(false);
        } else {
          console.log("⚠️ Failed to create conversation, using temporary ID");
          const tempConversationId = `temp-${Date.now()}`;
          setCid(tempConversationId);
          setShowForm(false);
        }
      } else {
        // Failed to create/find customer
        // Fallback: create a temporary customer and conversation for testing
        // const tempCustomer = {
        //   id: `temp-${Date.now()}`,
        //   display_name: data.name,
        //   email: data.email,
        //   website: site,
        //   status: "ACTIVE" as const,
        //   created_at: new Date().toISOString(),
        // };
        const tempConversationId = `temp-conv-${Date.now()}`;
        // Using temporary customer and conversation
        setCid(tempConversationId);
        setShowForm(false);
      }
    } catch {
      // Error in customer submit
      // Fallback: create temporary data for testing
      // const tempCustomer = {
      //   id: `temp-${Date.now()}`,
      //   display_name: data.name,
      //   email: data.email,
      //   website: site,
      //   status: "ACTIVE" as const,
      //   created_at: new Date().toISOString(),
      // };
      const tempConversationId = `temp-conv-${Date.now()}`;
      // Error occurred, using temporary data
      setCid(tempConversationId);
      setShowForm(false);
    }
  };

  const messages = useMemo<ChatMessage[]>(() => {
    return (messageRows ?? []).map((m) => ({
      id: m.id,
      author: m.sender_type === "AGENT" ? "agent" : "customer" as ChatMessage["author"],
      name: m.sender_type === "AGENT" ? "Agent" : "Customer",
      text: m.body_text,
      time: new Date(m.created_at).toLocaleTimeString(),
    }));
  }, [messageRows]);

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
      
      {/* Messages area - takes remaining space */}
      <div className="flex-1 overflow-hidden bg-white min-h-0">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {/* Initial prompt */}
            <div className="text-center text-gray-900 text-sm font-medium">
              Ask us anything, or share your feedback.
            </div>
            
            {/* Info bubble */}
            <div className="bg-gray-100 rounded-lg p-3 flex items-start gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-white text-xs font-bold">i</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="text-sm text-gray-700">
                  Please share your email with us in case we can't get back to you right away.
                </span>
              </div>
            </div>
            
            {/* Agent message bubble */}
            <div className="bg-gray-100 rounded-lg p-3">
              <div className="text-sm text-gray-700">
                Hi there! 👋 Need help with our services? Just ask here and we'll assist you!
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Pearl · 3w ago
              </div>
            </div>
            
            {/* Existing messages */}
            {messages.length > 0 && (
              <div className="space-y-2">
                {messages.map((message) => (
                  <div key={message.id} className={`${message.author === 'agent' ? 'bg-gray-100' : 'bg-blue-500 text-white'} rounded-lg p-3`}>
                    <div className="text-sm">{message.text}</div>
                    <div className={`text-xs mt-1 ${message.author === 'agent' ? 'text-gray-500' : 'text-blue-100'}`}>
                      {message.name} · {message.time}
                    </div>
                  </div>
                ))}
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
            className="w-full px-4 py-3 pr-20 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const text = e.currentTarget.value.trim();
                if (text) {
                  // Send message logic
                  console.log("💬 Sending message:", { text, cid, customer: customer?.id });
                  const sendMessage = async () => {
                    const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                    if (!client || !cid || !customer) {
                      console.error("❌ Missing required data for message sending:", { client: !!client, cid, customer: !!customer });
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
                  e.currentTarget.value = "";
                }
              }
            }}
          />
          
          {/* Icons on the left */}
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600 text-xs font-medium">GIF</button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
          
          {/* Send button on the right */}
          <button 
            onClick={(e) => {
              const input = e.currentTarget.parentElement?.querySelector('input');
              if (input) {
                const text = input.value.trim();
                if (text) {
                  // Send message logic
                  console.log("💬 Sending message:", { text, cid, customer: customer?.id });
                  const sendMessage = async () => {
                    const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
                    if (!client || !cid || !customer) {
                      console.error("❌ Missing required data for message sending:", { client: !!client, cid, customer: !!customer });
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
                  input.value = "";
                }
              }
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300"
          >
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
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


