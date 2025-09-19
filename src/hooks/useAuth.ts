"use client";

import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export type AuthUser = {
  user: User | null;
  agent: {
    id: string;
    name: string;
    email: string;
    role: "owner" | "admin" | "agent";
    organization_id: string;
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

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        setLoading(false);
      }
    };

    getInitialSession();

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

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (user: User) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    try {
      // Get agent data
      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .select(`
          id,
          name,
          email,
          role,
          organization_id
        `)
        .eq("user_id", user.id)
        .single();

      if (agentError) {
        throw agentError;
      }

      // Get organization data separately
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", agentData.organization_id)
        .single();

      if (orgError) {
        console.error("Error loading organization data:", orgError);
        setAuthUser({
          user,
          agent: {
            id: agentData.id,
            name: agentData.name,
            email: agentData.email,
            role: agentData.role,
            organization_id: agentData.organization_id,
          },
          organization: null,
        });
      } else {
        setAuthUser({
          user,
          agent: {
            id: agentData.id,
            name: agentData.name,
            email: agentData.email,
            role: agentData.role,
            organization_id: agentData.organization_id,
          },
          organization: orgData,
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      setAuthUser({
        user,
        agent: null,
        organization: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const supabase = getSupabaseBrowser();
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return {
    ...authUser,
    loading,
    signOut,
  };
}
