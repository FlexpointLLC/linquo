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
        console.error("❌ Supabase client not available");
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
        console.error("❌ Error finding customer:", findError);
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
          const { data: newOrg, error: orgError } = await client
            .from("organizations")
            .insert({
              name: orgName,
              slug: orgSlug
            })
            .select("id")
            .single();
          
          if (orgError) {
            console.error("❌ Error creating organization for domain:", orgError);
          } else {
            orgId = newOrg.id;
            console.log("✅ Created new organization for domain:", domain, "ID:", orgId);
          }
        }

        const { data: newCustomer, error: createError } = await client
          .from("customers")
          .upsert({
            display_name: name,
            email,
            status: "ACTIVE",
            org_id: orgId, // Include org_id
          }, {
            onConflict: 'email',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (createError) {
          console.error("❌ Error creating customer:", createError);
          throw createError;
        }

        console.log("✅ New customer created:", newCustomer);
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
      console.log("✅ Customer saved to localStorage and state:", customerWithWebsite);

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
    console.log("🔄 Starting createConversation for customer:", customer);
    try {
      const client = getSupabaseBrowser();
      if (!client) {
        console.error("❌ Supabase client not available for conversation creation");
        return null;
      }
      console.log("✅ Supabase client available for conversation creation");

      // Check if conversation already exists for this customer
      console.log("🔍 Checking for existing conversation for customer ID:", customer.id);
      const { data: existingConv, error: findError } = await client
        .from("conversations")
        .select("id")
        .eq("customer_id", customer.id)
        .maybeSingle();

      if (findError) {
        console.error("❌ Error finding existing conversation:", findError);
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
        console.log("🔄 Trying conversation creation with org_id...");
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
        console.log("❌ With org_id approach failed:", e);
        error = e;
      }
      
      // Approach 2: If first approach fails, try with just customer_id and org_id
      if (error && !newConversation) {
        try {
          console.log("🔄 Trying with customer_id and org_id only...");
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
          console.log("❌ Customer_id + org_id approach failed:", e);
          error = e;
        }
      }

      if (error || !newConversation) {
        console.error("❌ Error creating conversation:", error);
        return null;
      }

      console.log("✅ Created new conversation:", newConversation.id);
      return newConversation.id;
    } catch (e: unknown) {
      console.error("❌ Error creating conversation:", e);
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
