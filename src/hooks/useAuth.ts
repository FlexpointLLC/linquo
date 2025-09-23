"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type AuthUser = {
  user: User | null;
  agent: {
    id: string;
    display_name: string;
    email: string;
    online_status: "ONLINE" | "AWAY" | "OFFLINE";
    org_id: string;
    role?: string;
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
    brand_color?: string;
    widget_text_line1?: string;
    widget_text_line2?: string;
    widget_icon_alignment?: string;
    widget_show_branding?: boolean;
    widget_open_on_load?: boolean;
    chat_header_name?: string;
    chat_header_subtitle?: string;
    widget_button_text?: string;
  } | null;
};

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser>({
    user: null,
    agent: null,
    organization: null,
  });
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');


  // Global fallback to prevent infinite loading
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      setLoading(false);
    }, 8000); // Reduced to 8 second global timeout

    return () => clearTimeout(globalTimeout);
  }, []);

  // Connection monitoring and auto-reconnection
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    let reconnectTimeout: NodeJS.Timeout;
    const healthCheckInterval: NodeJS.Timeout = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('disconnected');
        }
      } catch {
        setConnectionStatus('disconnected');
        // Attempt to reconnect
        setConnectionStatus('reconnecting');
        reconnectTimeout = setTimeout(() => {
          window.location.reload();
        }, 5000);
      }
    }, 30000);

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        setConnectionStatus('disconnected');
      } else if (event === 'SIGNED_IN') {
        setConnectionStatus('connected');
      }
    });

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(healthCheckInterval);
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Immediate timeout fallback
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 3000); // Reduced to 3 second timeout

    const supabase = getSupabaseBrowser();
    
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadUserData = async (user: User, retryCount = 0) => {
      try {
        // Check localStorage cache first
        const cacheKey = `auth_${user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { agentData, orgData, timestamp } = JSON.parse(cached);
          // Use cache if less than 2 minutes old
          if (Date.now() - timestamp < 2 * 60 * 1000) {
            setAuthUser({ user, agent: agentData, organization: orgData });
            setLoading(false);
            return;
          }
        }

        // Get agent data with timeout
        const agentPromise = supabase
          .from("agents")
          .select(`
            id,
            display_name,
            email,
            online_status,
            org_id,
            role
          `)
          .eq("user_id", user.id)
          .single();
        
        const result = await Promise.race([
          agentPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Agent query timeout')), 3000)
          )
        ]);
        
        const { data: agentData, error: agentError } = result;

        if (agentError) {
          // If this is a "not found" error and we haven't retried, wait a bit and try again
          if (agentError.code === 'PGRST116' && retryCount < 2) {
            setTimeout(() => {
              loadUserData(user, retryCount + 1);
            }, 1000); // Reduced retry delay
            return;
          }
          
          // If agent doesn't exist after retries, keep the user but set agent/organization to null
          setAuthUser({
            user,
            agent: null,
            organization: null,
          });
          setLoading(false);
          return;
        }

        // Get organization data separately with timeout
        const orgPromise = supabase
          .from("organizations")
          .select("id, name, slug, brand_color, widget_text_line1, widget_text_line2, widget_icon_alignment, widget_show_branding, widget_open_on_load, chat_header_name, chat_header_subtitle, widget_button_text")
          .eq("id", agentData.org_id)
          .single();
        
        const orgResult = await Promise.race([
          orgPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Organization query timeout')), 5000)
          )
        ]);
        
        const { data: orgData, error: orgError } = orgResult;

        if (orgError) {
          // Keep the user and agent, but set organization to null
          setAuthUser({
            user,
            agent: {
              id: agentData.id,
              display_name: agentData.display_name,
              email: agentData.email,
              online_status: agentData.online_status,
              org_id: agentData.org_id,
            },
            organization: null,
          });
        } else {
          const authData = {
            user,
            agent: {
              id: agentData.id,
              display_name: agentData.display_name,
              email: agentData.email,
              online_status: agentData.online_status,
              org_id: agentData.org_id,
            },
            organization: orgData,
          };
          
          setAuthUser(authData);
          
          // Cache the auth data
          localStorage.setItem(cacheKey, JSON.stringify({
            agentData: authData.agent,
            orgData: authData.organization,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        // Log the error for debugging but keep the user logged in
        console.warn('Auth data loading error:', error);
        
        // Keep the user logged in even if there's an error
        setAuthUser({
          user,
          agent: null,
          organization: null,
        });
      } finally {
        setLoading(false);
      }
    };

    const initializeAuth = async () => {
      try {
        // Get initial session with timeout
        const sessionPromise = supabase.auth.getSession();
        const sessionResult = await Promise.race([
          sessionPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Session query timeout')), 10000)
          )
        ]);
        
        const { data: { session }, error } = sessionResult;
        
        if (error) {
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          await loadUserData(session.user);
        } else {
          setLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (session?.user) {
              await loadUserData(session.user);
            } else {
              setAuthUser({
                user: null,
                agent: null,
                organization: null,
              });
              setLoading(false);
            }
          }
        );

        return subscription;

      } catch (error) {
        console.warn('Auth initialization error:', error);
        setLoading(false);
        return null;
      }
    };

    // Initialize auth
    initializeAuth().then((subscription) => {
      // Store subscription for cleanup if needed
      if (subscription) {
        // We could store this in a ref if we need to clean it up
        // For now, we'll let it run
      }
    });

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase client not available");

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    organizationName: string,
    organizationSlug: string
  ) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) throw new Error("Supabase client not available");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    });

    if (authError) throw authError;
    if (!data.user) throw new Error("User not created");

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from("organizations")
      .insert({ 
        name: organizationName, 
        slug: organizationSlug,
        brand_color: "#3B82F6" // Default brand color for new organizations
      })
      .select()
      .single();

    if (orgError) {
      await supabase.auth.admin.deleteUser(data.user.id);
      throw orgError;
    }

        // Create agent (owner role)
        const { data: agentData, error: agentError } = await supabase.from("agents").insert({
          user_id: data.user.id,
          display_name: name,
          email,
          online_status: "OFFLINE",
          org_id: orgData.id,
        }).select().single();

        if (agentError) {
          await supabase.auth.admin.deleteUser(data.user.id);
          await supabase.from("organizations").delete().eq("id", orgData.id);
          throw agentError;
        }

        // Create default OWNER role for the new organization
        const { data: ownerRoleData, error: roleError } = await supabase.from("roles").insert({
          org_id: orgData.id,
          role_key: "OWNER",
          permissions: {
            "agents:read": true, "agents:write": true, "agents:delete": true,
            "customers:read": true, "customers:write": true, "customers:delete": true,
            "conversations:read": true, "conversations:write": true, "conversations:delete": true,
            "messages:read": true, "messages:write": true, "messages:delete": true,
            "settings:read": true, "settings:write": true
          }
        }).select().single();

        if (roleError) {
          await supabase.auth.admin.deleteUser(data.user.id);
          await supabase.from("organizations").delete().eq("id", orgData.id);
          await supabase.from("agents").delete().eq("id", agentData.id);
          throw roleError;
        }

        // Assign owner role to the agent
        await supabase.from("agent_role_assignments").insert({
          org_id: orgData.id,
          agent_id: agentData.id,
          role_id: ownerRoleData.id,
        });
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.auth.signOut();
    }
    // Clear all auth data on logout
    setAuthUser({ user: null, agent: null, organization: null });
    setLoading(false);
    setConnectionStatus('disconnected');
    
    // Clear data cache on logout
    try {
      const { clearCache } = await import("./useDataCache");
      clearCache();
    } catch {
      // Ignore import errors
    }
  };

  return {
    ...authUser,
    loading,
    connectionStatus,
    signIn,
    signUp,
    signOut,
  };
}