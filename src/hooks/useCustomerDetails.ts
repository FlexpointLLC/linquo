"use client";
import { useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/browser";

export type CustomerDetails = {
  id: string;
  display_name: string;
  email: string;
  status: string;
  country: string;
  created_at: string;
  // Device & Browser Information
  user_agent?: string;
  browser_name?: string;
  browser_version?: string;
  os_name?: string;
  os_version?: string;
  device_type?: string;
  screen_resolution?: string;
  timezone?: string;
  // Network & Location Information
  ip_address?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone_offset?: number;
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

// Cache for customer details
const customerDetailsCache = new Map<string, { data: CustomerDetails; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useCustomerDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCustomerDetails = useCallback(async (customerId: string): Promise<CustomerDetails | null> => {
    // Check cache first
    const cached = customerDetailsCache.get(customerId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    setLoading(true);
    setError(null);

    try {
      const client = getSupabaseBrowser();
      if (!client) {
        throw new Error("Supabase client not available");
      }

      const { data, error } = await client
        .from("customers")
        .select("*")
        .eq("id", customerId)
        .single();

      if (error) {
        throw error;
      }

      // Cache the result
      customerDetailsCache.set(customerId, {
        data: data as CustomerDetails,
        timestamp: Date.now()
      });

      return data as CustomerDetails;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load customer details";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCache = useCallback((customerId?: string) => {
    if (customerId) {
      customerDetailsCache.delete(customerId);
    } else {
      customerDetailsCache.clear();
    }
  }, []);

  return {
    getCustomerDetails,
    loading,
    error,
    clearCache
  };
}
