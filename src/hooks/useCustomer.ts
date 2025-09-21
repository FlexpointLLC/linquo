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
  org_id: string;
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
      } catch {
        // Failed to parse saved customer
        localStorage.removeItem("linquo_customer");
      }
    }
  }, []);

  const createOrGetCustomer = async (name: string, email: string, website: string): Promise<Customer | null> => {
    console.log("🚀 Starting createOrGetCustomer with:", { name, email, website });
    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseBrowser();
      if (!client) {
        console.log("❌ Supabase client not available");
        throw new Error("Supabase client not available");
      }
      console.log("✅ Supabase client available");

      // First, try to find existing customer by email
      const { data: existingCustomer, error: findError } = await client
        .from("customers")
        .select("*")
        .eq("email", email)
        .maybeSingle();

      if (findError) {
        console.log("❌ Error finding customer:", findError);
      } else {
        console.log("🔍 Customer search result:", existingCustomer ? "Found existing" : "No existing customer");
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
        // Use the website domain as the organization identifier
        let orgId = null;
        
        // Create a clean domain name for the organization
        const domain = website.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const orgSlug = `widget-${domain.replace(/[^a-zA-Z0-9-]/g, '-')}`;
        const orgName = `${domain} (Widget)`;
        
        console.log("🌐 Creating organization for domain:", domain, "slug:", orgSlug);
        
        
        // Try to find existing organization for this domain
        const { data: existingOrg } = await client
          .from("organizations")
          .select("id")
          .eq("slug", orgSlug)
          .maybeSingle();
        
        if (existingOrg) {
          orgId = existingOrg.id;
          console.log("✅ Found existing organization for domain:", orgId);
        } else {
          // Create new organization for this domain
          console.log("📝 Creating new organization...");
          const { data: newOrg, error: orgError } = await client
            .from("organizations")
            .insert({
              name: orgName,
              slug: orgSlug
            })
            .select("id")
            .single();
          
          if (orgError) {
            console.log("❌ Error creating organization for domain:", orgError);
            throw orgError;
          } else {
            orgId = newOrg.id;
            console.log("✅ Created new organization for domain:", domain, "ID:", orgId);
          }
        }

        console.log("📝 Creating new customer with org_id:", orgId);
        
        // First try to insert the customer
        const { data: newCustomer, error: createError } = await client
          .from("customers")
          .insert({
            display_name: name,
            email,
            status: "ACTIVE",
            org_id: orgId, // Include org_id
          })
          .select()
          .single();

        if (createError) {
          console.log("❌ Error creating customer:", createError);
          
          // If it's a duplicate email error, try to fetch the existing customer
          if (createError.code === '23505' || createError.message.includes('duplicate')) {
            console.log("🔄 Duplicate email detected, fetching existing customer...");
            const { data: existingCustomer, error: fetchError } = await client
              .from("customers")
              .select("*")
              .eq("email", email)
              .single();
            
            if (fetchError) {
              console.log("❌ Error fetching existing customer:", fetchError);
              throw createError; // Throw original error
            } else {
              customerData = existingCustomer;
              console.log("✅ Found existing customer:", existingCustomer);
            }
          } else {
            throw createError;
          }
        } else {
          customerData = newCustomer;
          console.log("✅ New customer created:", newCustomer);
        }
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
      console.log("✅ Customer saved to localStorage and state:", customerWithWebsite);

      return customerWithWebsite;
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create customer";
      console.error("❌ Error in createOrGetCustomer:", e);
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (customer: Customer): Promise<string | null> => {
    try {
      console.log("🔄 Starting createConversation for customer:", customer);
      const client = getSupabaseBrowser();
      if (!client) {
        console.log("❌ Supabase client not available for conversation creation");
        return null;
      }

      // Check if conversation already exists for this customer
      const { data: existingConv, error: findError } = await client
        .from("conversations")
        .select("id")
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (findError) {
        // Error finding existing conversation
      }

      if (existingConv) {
        console.log("✅ Found existing conversation:", existingConv.id);
        return existingConv.id;
      }
      
      console.log("📝 No existing conversation found, creating new one...");

      
      // Try different conversation creation approaches
      let newConversation = null;
      let error = null;
      
      // Approach 1: Try with org_id included
      try {
        const result = await client
          .from("conversations")
          .insert({
            customer_id: customer.id,
            org_id: customer.org_id, // Include org_id from customer
            last_message_at: new Date().toISOString(),
          })
          .select("id")
          .single();
        
        newConversation = result.data;
        error = result.error;
        console.log("✅ With org_id approach result:", { data: newConversation, error });
      } catch (e) {
        error = e;
      }
      
      // Approach 2: If first approach fails, try with just customer_id and org_id
      if (error && !newConversation) {
        console.log("🔄 Trying with customer_id and org_id only...");
        try {
          const result = await client
            .from("conversations")
            .insert({
              customer_id: customer.id,
              org_id: customer.org_id,
            })
            .select("id")
            .single();
          
          newConversation = result.data;
          error = result.error;
          console.log("✅ Customer_id + org_id approach result:", { data: newConversation, error });
        } catch (e) {
          error = e;
          console.log("❌ Customer_id + org_id approach failed:", e);
        }
      }

      if (error || !newConversation) {
        console.log("❌ Error creating conversation:", error);
        return null;
      }

      console.log("✅ Created new conversation:", newConversation.id);
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
