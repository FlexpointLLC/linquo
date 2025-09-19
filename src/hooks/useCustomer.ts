"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Customer = {
  id: string;
  name: string;
  email: string;
  website: string;
  status: "active" | "solved" | "churned" | "trial";
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
        // Failed to parse saved customer
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
        // Supabase client not available
        throw new Error("Supabase client not available");
      }

      // First, try to find existing customer by email (website column might not exist yet)
      const { data: existingCustomer, error: findError } = await client
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (findError) {
        // Error finding customer
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
            // Error updating customer
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
            status: "active",
          })
          .select()
          .single();

        if (createError) {
          throw createError;
        }

        customerData = newCustomer;
      }

      // Add website and ensure status is set for local use
      const customerWithWebsite = {
        ...customerData,
        website: website,
        status: customerData.status || "active",
      };

      // Save to localStorage
      localStorage.setItem("linquo_customer", JSON.stringify(customerWithWebsite));
      setCustomer(customerWithWebsite);

      return customerWithWebsite;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create customer";
      setError(errorMessage);
      // Error creating/getting customer
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (customer: Customer): Promise<string | null> => {
    try {
      const client = getSupabaseBrowser();
      if (!client) {
        // Supabase client not available for conversation creation
        return null;
      }

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
        // Error creating conversation
        return null;
      }

      return newConversation.id;
    } catch (e: unknown) {
      // Error creating conversation
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
