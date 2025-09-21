"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import { useAuth } from "@/hooks/useAuth";

export type CachedAgent = { id: string; display_name: string; email: string; online_status: string };
export type CachedCustomer = { id: string; display_name: string; email: string; status: "ACTIVE" | "BLOCKED"; country?: string };

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
      // Load agents and customers in parallel
      const [agentsResult, customersResult] = await Promise.all([
        client
          .from("agents")
          .select("id,display_name,email,online_status")
          .eq("org_id", agent.org_id)
          .order("display_name"),
        client
          .from("customers")
          .select("id,display_name,email,status,country")
          .eq("org_id", agent.org_id)
          .order("display_name")
      ]);

      if (agentsResult.error) throw agentsResult.error;
      if (customersResult.error) throw customersResult.error;

      // Update global cache
      globalCache.agents = agentsResult.data as CachedAgent[];
      globalCache.customers = customersResult.data as CachedCustomer[];
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
    if (agent?.org_id && !globalCache.lastLoaded) {
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
