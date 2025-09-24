"use client";
import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";
import { useAuth } from "@/hooks/useAuth";

export type Customer = { 
  id: string; 
  display_name: string; 
  email: string; 
  status: "ACTIVE" | "BLOCKED"; 
  country?: string; 
  created_at: string;
  
  // Device & Browser Information
  user_agent?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: 'Desktop' | 'Mobile' | 'Tablet';
  screen_resolution?: string;
  timezone?: string;
  
  // Network & Location Information
  ip_address?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone_offset?: string;
  
  // Website Context
  current_url?: string;
  page_title?: string;
  referrer_url?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  
  // Behavioral Data
  session_id?: string;
  session_start?: string;
  is_returning?: boolean;
  total_visits?: number;
  last_visit?: string;
  avg_session_duration?: number;
  
  // Technical Information
  connection_type?: string;
  network_speed?: string;
  page_load_time?: number;
  
  // Privacy & Consent
  gdpr_consent?: boolean;
  cookie_consent?: boolean;
  privacy_policy_accepted?: boolean;
  
  // Additional metadata
  device_fingerprint?: string;
  language?: string;
  color_depth?: number;
  pixel_ratio?: number;
};

export function useCustomers() {
  const [data, setData] = useState<Customer[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { agent } = useAuth();

  useEffect(() => {
    const client = getSupabaseBrowser();
    async function load() {
      try {
        if (!client) {
          setData([]);
          setLoading(false);
          return;
        }
        
        // If agent is not available, don't clear data - keep existing customers
        if (!agent?.org_id) {
          setLoading(false);
          return;
        }
        
        const { data, error } = await client
          .from("customers")
          .select("id,display_name,email,status,country,created_at")
          .eq("org_id", agent.org_id)
          .order("display_name");
        if (error) throw error;
        
        setData(data as Customer[]);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load customers");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agent?.org_id]);

  return { data, loading, error };
}


