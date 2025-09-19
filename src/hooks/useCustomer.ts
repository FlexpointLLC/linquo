"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Customer = {
  id: string;
  name: string;
  email: string;
  website: string;
  created_at: string;
};

export function useCustomer() {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customer from localStorage on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem("linquo_customer");
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (e) {
        console.error("Failed to parse saved customer:", e);
        localStorage.removeItem("linquo_customer");
      }
    }
  }, []);

  const createOrGetCustomer = async (name: string, email: string, website: string): Promise<Customer | null> => {
    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseBrowser();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      // First, try to find existing customer by email and website
      const { data: existingCustomer, error: findError } = await client
        .from("customers")
        .select("*")
        .eq("email", email)
        .eq("website", website)
        .maybeSingle();

      if (findError) {
        console.error("Error finding customer:", findError);
      }

      let customerData: Customer;

      if (existingCustomer) {
        // Update existing customer with new name if different
        if (existingCustomer.name !== name) {
          const { data: updatedCustomer, error: updateError } = await client
            .from("customers")
            .update({ name })
            .eq("id", existingCustomer.id)
            .select()
            .single();

          if (updateError) {
            console.error("Error updating customer:", updateError);
            customerData = existingCustomer;
          } else {
            customerData = updatedCustomer;
          }
        } else {
          customerData = existingCustomer;
        }
      } else {
        // Create new customer
        const { data: newCustomer, error: createError } = await client
          .from("customers")
          .insert({
            name,
            email,
            website,
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        customerData = newCustomer;
      }

      // Save to localStorage
      localStorage.setItem("linquo_customer", JSON.stringify(customerData));
      setCustomer(customerData);

      return customerData;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create customer";
      setError(errorMessage);
      console.error("Error creating/getting customer:", e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (customer: Customer): Promise<string | null> => {
    try {
      const client = getSupabaseBrowser();
      if (!client) return null;

      // Create conversation title with customer name and website
      const conversationTitle = `${customer.name} (${customer.website})`;

      // Check if conversation already exists
      const { data: existingConv } = await client
        .from("conversations")
        .select("id")
        .eq("title", conversationTitle)
        .maybeSingle();

      if (existingConv) {
        return existingConv.id;
      }

      // Create new conversation
      const { data: newConversation, error } = await client
        .from("conversations")
        .insert({
          title: conversationTitle,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return null;
      }

      return newConversation.id;
    } catch (e: unknown) {
      console.error("Error creating conversation:", e);
      return null;
    }
  };

  const clearCustomer = () => {
    localStorage.removeItem("linquo_customer");
    setCustomer(null);
  };

  return {
    customer,
    loading,
    error,
    createOrGetCustomer,
    createConversation,
    clearCustomer,
  };
}
