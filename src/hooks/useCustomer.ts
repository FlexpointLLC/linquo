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

  const createOrGetCustomerWithOrgId = async (name: string, email: string, orgId: string): Promise<Customer | null> => {
    console.log("🚀 Starting createOrGetCustomerWithOrgId with:", { name, email, orgId });
    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseBrowser();
      if (!client) {
        console.log("❌ Supabase client not available");
        throw new Error("Supabase client not available");
      }
      console.log("✅ Supabase client available");

      // First, try to find existing customer by email and org_id
      const { data: existingCustomer, error: findError } = await client
        .from("customers")
        .select("*")
        .eq("email", email)
        .eq("org_id", orgId)
        .maybeSingle();

      if (findError) {
        console.log("❌ Error finding customer:", findError);
      } else {
        console.log("🔍 Customer search result:", existingCustomer ? "Found existing" : "No existing customer");
      }

      if (existingCustomer) {
        console.log("✅ Found existing customer:", existingCustomer);
        const customerWithWebsite = { ...existingCustomer, website: window.location.hostname };
        setCustomer(customerWithWebsite);
        localStorage.setItem("linquo_customer", JSON.stringify(customerWithWebsite));
        console.log("✅ Customer saved to localStorage and state:", customerWithWebsite);
        return customerWithWebsite;
      }

      // Create new customer with the provided org_id
      console.log("📝 Creating new customer with org_id:", orgId);
      const { data: newCustomer, error: createError } = await client
        .from("customers")
        .insert({
          display_name: name,
          email: email,
          org_id: orgId,
          status: "ACTIVE",
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      let customerData: Customer | null = null;

      if (createError) {
        console.log("❌ Error creating customer:", createError);
        if (createError.code === '23505' || createError.message.includes('duplicate')) {
          console.log("🔄 Duplicate email detected, fetching existing customer...");
          // Try to fetch the existing customer
          const { data: existingCustomer, error: fetchError } = await client
            .from("customers")
            .select("*")
            .eq("email", email)
            .eq("org_id", orgId)
            .single();

          if (fetchError) {
            console.log("❌ Error fetching existing customer:", fetchError);
            throw createError;
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

      if (customerData) {
        const customerWithWebsite = { ...customerData, website: window.location.hostname };
        setCustomer(customerWithWebsite);
        localStorage.setItem("linquo_customer", JSON.stringify(customerWithWebsite));
        console.log("✅ Customer saved to localStorage and state:", customerWithWebsite);
        return customerWithWebsite;
      }

      return null;
    } catch (e: unknown) {
      console.error("❌ Error in createOrGetCustomerWithOrgId:", e);
      console.error("❌ Error type:", typeof e);
      console.error("❌ Error details:", JSON.stringify(e, null, 2));
      
      let errorMessage = "Failed to create customer";
      if (e instanceof Error) {
        errorMessage = e.message;
      } else if (typeof e === 'object' && e !== null) {
        // Handle Supabase errors or other object errors
        const errorObj = e as Record<string, unknown>;
        if (errorObj.message && typeof errorObj.message === 'string') {
          errorMessage = errorObj.message;
        } else if (errorObj.error && typeof errorObj.error === 'string') {
          errorMessage = errorObj.error;
        } else if (errorObj.code && typeof errorObj.code === 'string') {
          errorMessage = `Error code: ${errorObj.code}`;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createOrGetCustomer = async (name: string, email: string, website: string): Promise<Customer | null> => {
    console.log("🚀 Starting createOrGetCustomer with:", { name, email, website });
    console.log("🔍 Function parameters:", {
      name: name,
      nameType: typeof name,
      email: email,
      emailType: typeof email,
      website: website,
      websiteType: typeof website
    });
    
    setLoading(true);
    setError(null);

    try {
      console.log("🔍 Getting Supabase client...");
      const client = getSupabaseBrowser();
      if (!client) {
        console.log("❌ Supabase client not available");
        throw new Error("Supabase client not available");
      }
      console.log("✅ Supabase client available");
      console.log("🔍 Environment check:", {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing"
      });
      
      console.log("🔍 Website parameter:", website);
      console.log("🔍 Website type:", typeof website);

      // Test basic Supabase connectivity (simplified)
      console.log("🔍 Testing Supabase connectivity...");
      try {
        const { error: testError } = await client
          .from("organizations")
          .select("id")
          .limit(1);
        
        if (testError) {
          console.log("❌ Supabase connectivity test failed:", testError);
          // Don't throw error, just log it and continue
        } else {
          console.log("✅ Supabase connectivity test passed");
        }
      } catch (connectError) {
        console.log("❌ Supabase connectivity error:", connectError);
        // Don't throw error, just log it and continue
      }

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

      let customerData: Customer | null = null;

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
        console.log("🔍 Domain processing:", {
          originalWebsite: website,
          processedDomain: domain,
          orgSlug: orgSlug,
          orgName: orgName
        });
        
        // For localhost, use a default organization or create a simple one
        if (domain === 'localhost' || domain.includes('localhost')) {
          console.log("🏠 Localhost detected, using default organization approach");
          try {
            // Try to find an existing organization first
            const { data: defaultOrg, error: findError } = await client
              .from("organizations")
              .select("id")
              .eq("slug", "localhost-widget")
              .maybeSingle();
            
            if (findError) {
              console.log("❌ Error finding localhost organization:", findError);
              throw findError;
            }
            
            if (defaultOrg) {
              orgId = defaultOrg.id;
              console.log("✅ Found existing localhost organization:", orgId);
            } else {
              console.log("📝 Creating new localhost organization...");
              const { data: newOrg, error: orgError } = await client
                .from("organizations")
                .insert({
                  name: "Localhost Widget",
                  slug: "localhost-widget"
                })
                .select("id")
                .single();
              
              if (orgError) {
                console.log("❌ Error creating localhost organization:", orgError);
                console.log("❌ Organization error details:", JSON.stringify(orgError, null, 2));
                throw orgError;
              } else {
                orgId = newOrg.id;
                console.log("✅ Created localhost organization:", orgId);
              }
            }
          } catch (localhostError) {
            console.log("❌ Localhost organization error:", localhostError);
            console.log("❌ Localhost error type:", typeof localhostError);
            console.log("❌ Localhost error details:", JSON.stringify(localhostError, null, 2));
            throw localhostError;
          }
        } else {
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
              slug: orgSlug,
              brand_color: "#3B82F6" // Default brand color for new organizations
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
        }

        console.log("📝 Creating new customer with org_id:", orgId);
        
        // First try to insert the customer
        const customerInsertData = {
          display_name: name,
          email,
          status: "ACTIVE",
          org_id: orgId, // Include org_id
          created_at: new Date().toISOString(),
        };
        
        console.log("📝 Customer data to insert:", customerInsertData);
        
        const { data: newCustomer, error: createError } = await client
          .from("customers")
          .insert(customerInsertData)
          .select()
          .single();

        if (createError) {
          console.log("❌ Error creating customer:", createError);
          console.log("❌ Customer creation error details:", JSON.stringify(createError, null, 2));
          console.log("❌ Customer creation error code:", createError.code);
          console.log("❌ Customer creation error message:", createError.message);
          
          // If it's a duplicate email error, try to fetch the existing customer
          if (createError.code === '23505' || createError.message.includes('duplicate')) {
            console.log("🔄 Duplicate email detected, fetching existing customer...");
            console.log("🔍 Looking for customer with email:", email, "and org_id:", orgId);
            
            const { data: existingCustomer, error: fetchError } = await client
              .from("customers")
              .select("*")
              .eq("email", email)
              .eq("org_id", orgId)
              .single();
            
            if (fetchError) {
              console.log("❌ Error fetching existing customer:", fetchError);
              console.log("❌ Fetch error details:", JSON.stringify(fetchError, null, 2));
              throw createError; // Throw original error
            } else {
              customerData = existingCustomer;
              console.log("✅ Found existing customer:", existingCustomer);
            }
          } else {
            console.log("❌ Non-duplicate error, throwing:", createError);
            throw createError;
          }
        } else {
          customerData = newCustomer;
          console.log("✅ New customer created:", newCustomer);
        }
      }

      // Ensure we have customer data
      if (!customerData) {
        console.log("❌ No customer data available");
        throw new Error("Failed to create or retrieve customer");
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
      console.error("❌ Error in createOrGetCustomer:", e);
      console.error("❌ Error type:", typeof e);
      console.error("❌ Error constructor:", e?.constructor?.name);
      console.error("❌ Error string:", String(e));
      console.error("❌ Error JSON:", JSON.stringify(e, null, 2));
      
      // Try to extract error information safely
      let errorMessage = "Failed to create customer";
      let errorCode = null;
      let errorDetails = null;
      
      try {
        if (e instanceof Error) {
          errorMessage = e.message || "Unknown error";
          errorDetails = e.stack;
          console.error("❌ Error instance details:", {
            name: e.name,
            message: e.message,
            stack: e.stack
          });
        } else if (typeof e === 'object' && e !== null) {
          const errorObj = e as Record<string, unknown>;
          errorMessage = (typeof errorObj.message === 'string' ? errorObj.message : null) || 
                        (typeof errorObj.error === 'string' ? errorObj.error : null) || 
                        (typeof errorObj.details === 'string' ? errorObj.details : null) || 
                        "Unknown object error";
          errorCode = typeof errorObj.code === 'string' ? errorObj.code : null;
          errorDetails = errorObj;
          console.error("❌ Error object details:", {
            message: errorObj.message,
            code: errorObj.code,
            details: errorObj.details,
            hint: errorObj.hint,
            fullObject: errorObj
          });
        } else if (typeof e === 'string') {
          errorMessage = e;
          console.error("❌ Error string:", e);
        } else {
          console.error("❌ Unknown error type:", typeof e, e);
        }
        
        console.error("❌ Parsed error message:", errorMessage);
        console.error("❌ Parsed error code:", errorCode);
        console.error("❌ Parsed error details:", errorDetails);
      } catch (parseError) {
        console.error("❌ Failed to parse error:", parseError);
        console.error("❌ Parse error details:", JSON.stringify(parseError, null, 2));
        errorMessage = `Raw error: ${String(e)}`;
      }
      
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
    } catch {
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
    createOrGetCustomerWithOrgId,
    createConversation,
    clearCustomer,
  };
}
