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
    console.log("Starting customer submit with:", { name: data.name, email: data.email, site });
    try {
      const customerData = await createOrGetCustomer(data.name, data.email, site);
      console.log("Customer creation result:", customerData);
      
      if (customerData) {
        console.log("Customer created/found:", customerData);
        const conversationId = await createConversation(customerData);
        console.log("Conversation creation result:", conversationId);
        
        if (conversationId) {
          console.log("Conversation created/found:", conversationId);
          setCid(conversationId);
          setShowForm(false);
          console.log("Form hidden, chat should be visible now");
        } else {
          console.error("Failed to create conversation");
          // Fallback: create a temporary conversation ID for testing
          const tempConversationId = `temp-${Date.now()}`;
          console.log("Using temporary conversation ID:", tempConversationId);
          setCid(tempConversationId);
          setShowForm(false);
        }
      } else {
        console.error("Failed to create/find customer");
        // Fallback: create a temporary customer and conversation for testing
        const tempCustomer = {
          id: `temp-${Date.now()}`,
          name: data.name,
          email: data.email,
          website: site,
          status: "active" as const,
          created_at: new Date().toISOString(),
        };
        const tempConversationId = `temp-conv-${Date.now()}`;
        console.log("Using temporary customer and conversation:", tempCustomer, tempConversationId);
        setCid(tempConversationId);
        setShowForm(false);
      }
    } catch (error) {
      console.error("Error in customer submit:", error);
      // Fallback: create temporary data for testing
      const tempCustomer = {
        id: `temp-${Date.now()}`,
        name: data.name,
        email: data.email,
        website: site,
        status: "active" as const,
        created_at: new Date().toISOString(),
      };
      const tempConversationId = `temp-conv-${Date.now()}`;
      console.log("Error occurred, using temporary data:", tempCustomer, tempConversationId);
      setCid(tempConversationId);
      setShowForm(false);
    }
  };

  const messages = useMemo<ChatMessage[]>(() => {
    return (messageRows ?? []).map((m) => ({
      id: m.id,
      author: m.author as ChatMessage["author"],
      name: m.name,
      text: m.text,
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
    <div className="h-full w-full bg-background text-foreground">
      <div className="border-b p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          <div className="font-medium text-sm">Support</div>
          {customer && (
            <div className="text-xs text-muted-foreground">
              • {customer.name}
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
      <ScrollArea className="h-[calc(100vh-120px)]">
        <MessageThread messages={messages} />
      </ScrollArea>
      <Composer
        onSend={async (text) => {
          const client = (await import("@/lib/supabase-browser")).getSupabaseBrowser();
          if (!client || !cid || !customer) return;
          await client.from("messages").insert({ 
            conversation_id: cid, 
            author: "customer", 
            name: customer.name, 
            text 
          });
          await client.from("conversations").update({ last_message_at: new Date().toISOString() }).eq("id", cid);
        }}
      />
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


