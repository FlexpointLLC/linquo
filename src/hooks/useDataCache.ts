"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type CachedAgent = { id: string; display_name: string; email: string; online_status: string; is_active: boolean; role?: string };
export type CachedCustomer = { 
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

interface DataCache {
  agents: CachedAgent[] | null;
  customers: CachedCustomer[] | null;
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
}

// Global cache state
let globalCache: DataCache = {
  agents: null,
  customers: null,
  loading: false,
  error: null,
  lastLoaded: null,
};

// Load cache from localStorage on initialization
const loadCacheFromStorage = () => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  try {
    const stored = localStorage.getItem('linquo-data-cache');
    if (stored) {
      const parsed = JSON.parse(stored);
      // Only use cached data if it's less than 5 minutes old
      if (parsed.lastLoaded && Date.now() - parsed.lastLoaded < 300000) {
        globalCache = { ...globalCache, ...parsed };
      }
    }
  } catch (error) {
    console.warn('Failed to load cache from localStorage:', error);
  }
};

// Save cache to localStorage
const saveCacheToStorage = (cache: DataCache) => {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem('linquo-data-cache', JSON.stringify({
      agents: cache.agents,
      customers: cache.customers,
      lastLoaded: cache.lastLoaded
    }));
  } catch (error) {
    console.warn('Failed to save cache to localStorage:', error);
  }
};

// Initialize cache from storage
loadCacheFromStorage();

// Cache listeners for components that need updates
const cacheListeners = new Set<() => void>();

export function useDataCache() {
  const [cache, setCache] = useState<DataCache>(globalCache);
  const { agent } = useAuth();

  // Subscribe to cache updates
  useEffect(() => {
    const listener = () => setCache({ ...globalCache });
    cacheListeners.add(listener);
    return () => {
      cacheListeners.delete(listener);
    };
  }, []);

  // Load all data once when agent is available
  const loadAllData = useCallback(async () => {
    const client = getSupabaseBrowser();
    if (!client || !agent?.org_id) {
      return;
    }

    // Prevent multiple simultaneous loads
    if (globalCache.loading) {
      return;
    }

    globalCache.loading = true;
    globalCache.error = null;
    notifyListeners();

    try {
      console.log("🔍 Loading data for org_id:", agent.org_id);
      
      // Load agents and customers in parallel
      const [agentsResult, customersResult] = await Promise.all([
        client
          .from("agents")
          .select("id,display_name,email,online_status,is_active,role")
          .eq("org_id", agent.org_id)
          .order("display_name"),
        client
          .from("customers")
          .select([
            "id",
            "display_name",
            "email",
            "status",
            "country",
            "created_at",
            // Device & Browser Information
            "user_agent",
            "browser_name",
            "browser_version",
            "os_name",
            "os_version",
            "device_type",
            "screen_resolution",
            "timezone",
            // Network & Location Information
            "ip_address",
            "region",
            "city",
            "postal_code",
            "latitude",
            "longitude",
            "timezone_offset",
            // Website Context
            "current_url",
            "page_title",
            "referrer_url",
            "utm_source",
            "utm_campaign",
            "utm_medium",
            // Behavioral Data
            "session_id",
            "session_start",
            "is_returning",
            "total_visits",
            "last_visit",
            "avg_session_duration",
            // Technical Information
            "connection_type",
            "network_speed",
            "page_load_time",
            // Privacy & Consent
            "gdpr_consent",
            "cookie_consent",
            "privacy_policy_accepted",
            // Additional metadata
            "device_fingerprint",
            "language",
            "color_depth",
            "pixel_ratio",
          ].join(","))
          .eq("org_id", agent.org_id)
          .order("display_name")
      ]);

      console.log("🔍 Agents query result:", agentsResult);
      console.log("🔍 Customers query result:", customersResult);

      if (agentsResult.error) {
        console.error("❌ Agents query error:", agentsResult.error);
        throw agentsResult.error;
      }
      if (customersResult.error) {
        console.error("❌ Customers query error:", customersResult.error);
        throw customersResult.error;
      }

      // Update global cache
      globalCache.agents = agentsResult.data as unknown as CachedAgent[];
      globalCache.customers = customersResult.data as unknown as CachedCustomer[];
      globalCache.lastLoaded = Date.now();
      globalCache.error = null;
      
      // Save to localStorage
      saveCacheToStorage(globalCache);
    } catch (error) {
      globalCache.error = error instanceof Error ? error.message : "Failed to load data";
    } finally {
      globalCache.loading = false;
      notifyListeners();
    }
  }, [agent?.org_id]);

  // Load data when agent becomes available
  useEffect(() => {
    if (agent?.org_id) {
      // Force reload every time to get fresh data
      globalCache.lastLoaded = null;
      loadAllData();
    }
  }, [agent?.org_id, loadAllData]);

  // Refresh function
  const refresh = useCallback(() => {
    globalCache.lastLoaded = null; // Force reload
    loadAllData();
  }, [loadAllData]);

  // Clear cache on logout
  const clearCache = useCallback(() => {
    globalCache = {
      agents: null,
      customers: null,
      loading: false,
      error: null,
      lastLoaded: null,
    };
    notifyListeners();
  }, []);

  return {
    agents: cache.agents,
    customers: cache.customers,
    loading: cache.loading,
    error: cache.error,
    refresh,
    clearCache,
    lastLoaded: cache.lastLoaded,
  };
}

// Helper function to notify all listeners
function notifyListeners() {
  cacheListeners.forEach(listener => listener());
}

// Export clearCache function for use in other modules
export function clearCache() {
  globalCache = {
    agents: null,
    customers: null,
    loading: false,
    error: null,
    lastLoaded: null,
  };
  notifyListeners();
}

// Export individual hooks for backward compatibility
export function useAgents() {
  const { agents, loading, error } = useDataCache();
  return { data: agents, loading, error };
}

export function useCustomers() {
  const { customers, loading, error } = useDataCache();
  return { data: customers, loading, error };
}
