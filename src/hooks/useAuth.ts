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

  console.log("🔧 useAuth hook called, current state:", { authUser, loading });

  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) {
      console.log("❌ No Supabase client available");
      setLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      console.log("🔍 Getting initial session...");
      const { data: { session } } = await supabase.auth.getSession();
      console.log("🔍 Session result:", { session: !!session, user: !!session?.user });
      if (session?.user) {
        await loadUserData(session.user);
      } else {
        console.log("❌ No session found, setting loading to false");
        setLoading(false);
      }
    };

    getInitialSession();

    // Fallback timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      console.log("⏰ Auth timeout - setting loading to false");
      setLoading(false);
    }, 10000); // 10 second timeout

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

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const loadUserData = async (user: User) => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    console.log("🔍 Loading user data for:", user.id);

    try {
      // Get agent data
      console.log("👤 Fetching agent data...");
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

      console.log("🔍 Agent query result:", { agentData, agentError });

      if (agentError) {
        console.error("❌ Agent error:", agentError);
        // If agent doesn't exist, this might be a Google OAuth user
        // We'll set the user but no agent/organization for now
        setAuthUser({
          user,
          agent: null,
          organization: null,
        });
        setLoading(false);
        return;
      }

      // Get organization data separately
      console.log("🏢 Fetching organization data for:", agentData.organization_id);
      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", agentData.organization_id)
        .single();

      console.log("🔍 Organization query result:", { orgData, orgError });

      if (orgError) {
        console.error("❌ Organization error:", orgError);
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
        console.log("✅ User data loaded successfully");
      }
    } catch (error) {
      console.error("❌ Error loading user data:", error);
      setAuthUser({
        user,
        agent: null,
        organization: null,
      });
    } finally {
      setLoading(false);
      console.log("🏁 Loading completed");
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
