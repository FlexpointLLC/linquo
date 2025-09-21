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
  } | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  } | null;
};

export function useAuth() {
  const [authUser, setAuthUser] = useState<AuthUser>({
    user: null,
    agent: null,
    organization: null,
  });
  const [loading, setLoading] = useState(true);


  // Global fallback to prevent infinite loading
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      setLoading(false);
    }, 15000); // 15 second global timeout

    return () => clearTimeout(globalTimeout);
  }, []);

  useEffect(() => {
    // Immediate timeout fallback
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 10000); // 10 second timeout

    const supabase = getSupabaseBrowser();
    
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadUserData = async (user: User, retryCount = 0) => {
      try {
        // Get agent data with timeout
        const agentPromise = supabase
          .from("agents")
          .select(`
            id,
            display_name,
            email,
            online_status,
            org_id
          `)
          .eq("user_id", user.id)
          .single();
        
        const result = await Promise.race([
          agentPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Agent query timeout')), 10000)
          )
        ]);
        
        const { data: agentData, error: agentError } = result;

        if (agentError) {
          // If this is a "not found" error and we haven't retried, wait a bit and try again
          if (agentError.code === 'PGRST116' && retryCount < 5) {
            setTimeout(() => {
              loadUserData(user, retryCount + 1);
            }, 2000 * (retryCount + 1)); // Exponential backoff
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
          .select("id, name, slug")
          .eq("id", agentData.org_id)
          .single();
        
        const orgResult = await Promise.race([
          orgPromise,
          new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Organization query timeout')), 10000)
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
          setAuthUser({
            user,
            agent: {
              id: agentData.id,
              display_name: agentData.display_name,
              email: agentData.email,
              online_status: agentData.online_status,
              org_id: agentData.org_id,
            },
            organization: orgData,
          });
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
      .insert({ name: organizationName, slug: organizationSlug })
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
  };

  return {
    ...authUser,
    loading,
    signIn,
    signUp,
    signOut,
  };
}