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
  const site = params.get("site") || window.location.hostname;
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
    <div className="h-full w-full bg-background text-foreground flex flex-col">
      <div className="border-b p-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <div className="font-medium text-sm">Support</div>
          {customer && (
            <div className="text-xs text-muted-foreground">
              • {customer.display_name}
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearCustomer();
            setShowForm(true);
            setCid(null);
          }}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <MessageThread messages={messages} />
        </ScrollArea>
      </div>
      <div className="flex-shrink-0">
        <Composer
        onSend={async (text) => {
          console.log("💬 Sending message:", { text, cid, customer: customer?.id });
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
              org_id: customer.org_id, // Include org_id
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
        }}
      />
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


