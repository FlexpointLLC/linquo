"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type Customer = {
  id: string;
  display_name: string;
  email: string;
  website?: string;
  status: "ACTIVE" | "BLOCKED";
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

      // First, try to find existing customer by email
      const { data: existingCustomer, error: findError } = await client
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (findError) {
        console.error("Error finding customer:", findError);
      }

      let customerData: Customer;

      if (existingCustomer) {
        // Update existing customer with new name if different
        if (existingCustomer.display_name !== name) {
          const { data: updatedCustomer, error: updateError } = await client
            .from("customers")
            .update({ display_name: name })
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
            display_name: name,
            email,
            status: "ACTIVE",
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating customer:", createError);
          throw createError;
        }

        customerData = newCustomer;
      }

      // Add website and ensure status is set for local use
      const customerWithWebsite = {
        ...customerData,
        website: website,
        status: customerData.status || "ACTIVE",
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
        console.error("Supabase client not available for conversation creation");
        return null;
      }

      // Check if conversation already exists for this customer
      const { data: existingConv } = await client
        .from("conversations")
        .select("id")
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (existingConv) {
        console.log("Found existing conversation:", existingConv.id);
        return existingConv.id;
      }

      // Create new conversation (without title column)
      const { data: newConversation, error } = await client
        .from("conversations")
        .insert({
          customer_id: customer.id,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return null;
      }

      console.log("Created new conversation:", newConversation.id);
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
