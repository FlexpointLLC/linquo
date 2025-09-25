"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { setSessionOrgId } from "@/lib/session-org";
import { authErrorHandler } from "@/lib/auth-error-handler";

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
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const lastUserIdRef = useRef<string | null>(null);


  // Global fallback to prevent infinite loading
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      setLoading(false);
    }, 2000); // Reduced to 2 second global timeout

    return () => clearTimeout(globalTimeout);
  }, []);

  // Simple auth state monitoring
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        setConnectionStatus('disconnected');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setConnectionStatus('connected');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Immediate timeout fallback
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 1000); // Reduced to 1 second timeout

    const supabase = createClient();
    
    if (!supabase) {
      setLoading(false);
      return;
    }

    const loadUserData = async (user: User, retryCount = 0) => {
      // Guard: avoid reloading same user repeatedly
      if (lastUserIdRef.current === user.id && retryCount === 0) {
        setLoading(false);
        return;
      }
      lastUserIdRef.current = user.id;
      
      console.log('[Auth] Loading user data - Step 1: Fetching org ID...');
      
      try {
        // Check localStorage cache first
        const cacheKey = `auth_${user.id}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const { agentData, orgData, timestamp } = JSON.parse(cached);
          // Use cache if less than 5 minutes old
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            console.log('[Auth] Using cached data with org ID:', agentData?.org_id);
            
            // Store Org ID in sessionStorage even when using cache
            if (agentData?.org_id) {
              setSessionOrgId(agentData.org_id);
              console.log('[Auth] 💾 Org ID from cache stored in session storage:', agentData.org_id);
            }
            
            setAuthUser({ user, agent: agentData, organization: orgData });
            setLoading(false);
            return;
          }
        }

        // PRIORITY: Get agent data to fetch org_id FIRST
        console.log('[Auth] Fetching agent profile to get org ID...');
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
        
        let agentData, agentError;
        
        try {
          const result = await Promise.race([
            agentPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Agent query timeout')), 1000)
            )
          ]);
          
          agentData = result.data;
          agentError = result.error;
        } catch (timeoutError) {
          // Handle timeout or other errors
          agentError = timeoutError instanceof Error ? timeoutError : new Error('Unknown error occurred');
          agentData = null;
        }

        if (agentError || !agentData) {
          console.error('[Auth] Failed to fetch agent profile and org ID:', agentError);
          
          // If this is a "not found" error and we haven't retried, wait a bit and try again
          const errorCode = (agentError as { code?: string })?.code;
          if (errorCode === 'PGRST116' && retryCount < 2) {
            console.log('[Auth] Agent not found, retrying in 1 second...');
            setTimeout(() => {
              loadUserData(user, retryCount + 1);
            }, 1000);
            return;
          }
          
          // CRITICAL ERROR: Cannot fetch org ID - force logout with error
          console.error('[Auth] CRITICAL: Unable to fetch organization ID - forcing logout');
          
          // Set specific error message
          const errorMessage = errorCode === 'PGRST116' 
            ? 'Your account is not associated with any organization. Please contact support.'
            : `Authentication error: ${agentError?.message || 'Unable to fetch organization data'}`;
          
          setError(errorMessage);
          
          // Force sign out since we can't determine org access
          const supabase = createClient();
          if (supabase) {
            await supabase.auth.signOut();
          }
          
          // Clear auth state
          setAuthUser({
            user: null,
            agent: null,
            organization: null,
          });
          setLoading(false);
          return;
        }

        // SUCCESS: Got org ID from agent profile
        console.log('[Auth] ✅ Org ID fetched successfully:', agentData.org_id);
        
        // Clear any previous errors
        setError(null);
        
        // IMMEDIATELY store Org ID in sessionStorage for quick access
        setSessionOrgId(agentData.org_id);
        console.log('[Auth] 💾 Org ID stored in session storage:', agentData.org_id);
        
        console.log('[Auth] Step 2: Fetching organization details...');

        // Get organization data using the org_id
        const orgPromise = supabase
          .from("organizations")
          .select("id, name, slug, brand_color, widget_text_line1, widget_text_line2, widget_icon_alignment, widget_show_branding, widget_open_on_load, chat_header_name, chat_header_subtitle, widget_button_text")
          .eq("id", agentData.org_id)
          .single();
        
        let orgData, orgError;
        
        try {
          const orgResult = await Promise.race([
            orgPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Organization query timeout')), 1000)
            )
          ]);
          
          orgData = orgResult.data;
          orgError = orgResult.error;
        } catch (timeoutError) {
          // Handle timeout or other errors
          orgError = timeoutError instanceof Error ? timeoutError : new Error('Unknown error occurred');
          orgData = null;
        }

        if (orgError) {
          console.error('[Auth] Failed to fetch organization details:', orgError);
          console.log('[Auth] ⚠️ Using org ID without full organization data:', agentData.org_id);
          
          // Still store Org ID in sessionStorage even if org details failed
          setSessionOrgId(agentData.org_id);
          console.log('[Auth] 💾 Org ID stored in session storage (without org details):', agentData.org_id);
          
          // Keep the user and agent with org_id, but set organization to null
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
        } else if (orgData) {
          console.log('[Auth] ✅ Organization data loaded successfully:', orgData.name);
          console.log('[Auth] 🏢 Complete auth data ready - Org ID:', agentData.org_id, '| Org Name:', orgData.name);
          
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
        let session, error;
        
        try {
          const sessionResult = await Promise.race([
            sessionPromise,
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Session query timeout')), 2000)
            )
          ]);
          
          session = sessionResult.data.session;
          error = sessionResult.error;
        } catch (timeoutError) {
          // Handle timeout or other errors
          error = timeoutError instanceof Error ? timeoutError : new Error('Unknown error occurred');
          session = null;
        }
        
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
              if (lastUserIdRef.current !== session.user.id) {
                // Force clear cache + reload on new login FIRST, before any data fetching
                if (event === 'SIGNED_IN' && lastUserIdRef.current === null) {
                  console.log('[Auth] New login detected - Step 1: Clearing cache...');
                  
                  // STEP 1: Clear cache FIRST
                  Object.keys(localStorage).forEach(key => {
                    if (
                      key.startsWith('auth_') || 
                      key.includes('cache') || 
                      key.includes('linquo') ||
                      key.includes('supabase') ||
                      key.includes('sb-') ||
                      key.startsWith('nextjs') ||
                      key.includes('conversation') ||
                      key.includes('message') ||
                      key.includes('customer') ||
                      key.includes('agent')
                    ) {
                      localStorage.removeItem(key);
                    }
                  });
                  
                  Object.keys(sessionStorage).forEach(key => {
                    if (
                      key.startsWith('auth_') || 
                      key.includes('cache') || 
                      key.includes('linquo') ||
                      key.includes('supabase') ||
                      key.includes('sb-')
                    ) {
                      sessionStorage.removeItem(key);
                    }
                  });
                  
                  try {
                    const { clearCache } = await import("./useDataCache");
                    clearCache();
                  } catch {
                    // Ignore import errors
                  }
                  
                  console.log('[Auth] Step 2: Performing hard reload...');
                  // STEP 2: Hard reload (this will trigger fresh data fetching automatically)
                  window.location.reload();
                  return;
                }
                await loadUserData(session.user);
              }
            } else {
              setAuthUser({
                user: null,
                agent: null,
                organization: null,
              });
              setLoading(false);
              lastUserIdRef.current = null;
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
    // Clear any previous errors
    setError(null);
    
    const supabase = createClient();
    if (!supabase) {
      const errorMsg = "Authentication service unavailable";
      setError(errorMsg);
      throw new Error(errorMsg);
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Set user-friendly error message
        let errorMessage = "Login failed";
        if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Invalid email or password";
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Please check your email and confirm your account";
        } else if (error.message.includes("Too many requests")) {
          errorMessage = "Too many login attempts. Please try again later";
        } else {
          errorMessage = error.message;
        }
        
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      // If we haven't already set an error, set a generic one
      if (!error) {
        setError("An unexpected error occurred during login");
      }
      throw error;
    }
  };

  const signUp = async (
    name: string,
    email: string,
    password: string,
    organizationName: string,
    organizationSlug: string
  ) => {
    console.log('[SignUp] 🚀 Starting signup process with validation...');
    
    const supabase = createClient();
    if (!supabase) {
      console.error('[SignUp] ❌ Supabase client not available');
      throw new Error("Authentication service not available");
    }

    let createdUserId: string | null = null;
    let createdOrgId: string | null = null;
    let createdAgentId: string | null = null;

    try {
      // VALIDATION STEP 1: Password Requirements
      console.log('[SignUp] Validation 1: Checking password requirements...');
      const passwordErrors = [];
      
      if (password.length < 8) {
        passwordErrors.push("Password must be at least 8 characters long");
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push("Password must contain at least one uppercase letter");
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push("Password must contain at least one lowercase letter");
      }
      if (!/\d/.test(password)) {
        passwordErrors.push("Password must contain at least one number");
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        passwordErrors.push("Password must contain at least one special character");
      }

      if (passwordErrors.length > 0) {
        console.error('[SignUp] ❌ Password validation failed:', passwordErrors);
        throw new Error(`Password requirements not met:\n• ${passwordErrors.join('\n• ')}`);
      }

      console.log('[SignUp] ✅ Password meets all requirements');

      // VALIDATION STEP 2: Check for duplicate organization slug
      console.log('[SignUp] Validation 2: Checking organization slug availability...');
      const slugToCheck = organizationSlug.toLowerCase().trim();
      
      const { data: existingOrg, error: slugCheckError } = await supabase
        .from("organizations")
        .select("id, slug")
        .eq("slug", slugToCheck)
        .maybeSingle();

      if (slugCheckError) {
        console.error('[SignUp] ❌ Error checking organization slug:', slugCheckError.message);
        throw new Error("Failed to validate organization URL. Please try again.");
      }

      if (existingOrg) {
        console.error('[SignUp] ❌ Organization slug already exists:', slugToCheck);
        throw new Error(`Organization URL "${slugToCheck}" is already taken. Please choose a different URL.`);
      }

      console.log('[SignUp] ✅ Organization slug is available:', slugToCheck);

      // VALIDATION STEP 3: Check for existing email (before creating auth user)
      console.log('[SignUp] Validation 3: Checking email availability...');
      const emailToCheck = email.toLowerCase().trim();
      
      const { data: existingAgent, error: emailCheckError } = await supabase
        .from("agents")
        .select("id, email")
        .eq("email", emailToCheck)
        .maybeSingle();

      if (emailCheckError && emailCheckError.code !== 'PGRST116') { // PGRST116 = not found, which is good
        console.error('[SignUp] ❌ Error checking email:', emailCheckError.message);
        throw new Error("Failed to validate email address. Please try again.");
      }

      if (existingAgent) {
        console.error('[SignUp] ❌ Email already exists:', emailToCheck);
        throw new Error(`An account with email "${emailToCheck}" already exists. Please use a different email or try logging in.`);
      }

      console.log('[SignUp] ✅ Email is available:', emailToCheck);

      // STEP 1: Create Supabase Auth User (after all validations pass)
      console.log('[SignUp] Step 1: Creating auth user for:', emailToCheck);
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: emailToCheck,
        password,
        options: {
          data: {
            full_name: name.trim(),
            display_name: name.trim(),
          }
        }
      });

      if (authError) {
        console.error('[SignUp] ❌ Auth error:', authError.message);
        
        // Handle specific Supabase auth errors
        let errorMessage = "Failed to create account";
        if (authError.message.includes("User already registered")) {
          errorMessage = `An account with email "${emailToCheck}" already exists. Please try logging in instead.`;
        } else if (authError.message.includes("Password should be")) {
          errorMessage = `Password is too weak. ${authError.message}`;
        } else if (authError.message.includes("Invalid email")) {
          errorMessage = "Please enter a valid email address.";
        } else {
          errorMessage = `Account creation failed: ${authError.message}`;
        }
        
        throw new Error(errorMessage);
      }

      if (!authData.user) {
        console.error('[SignUp] ❌ No user data returned from auth');
        throw new Error("Failed to create user account - no user data");
      }

      createdUserId = authData.user.id;
      console.log('[SignUp] ✅ Auth user created successfully:', createdUserId);

      // STEP 2: Create Organization with complete data
      console.log('[SignUp] Step 2: Creating organization:', organizationName);
      
      const organizationData = {
        name: organizationName.trim(),
        slug: organizationSlug.toLowerCase().trim(),
        brand_color: "#3B82F6",
        widget_text_line1: "Hello there",
        widget_text_line2: "How can we help?",
        widget_icon_alignment: "right",
        widget_show_branding: true,
        widget_open_on_load: false,
        chat_header_name: "Support Team",
        chat_header_subtitle: "Typically replies within 1 min",
        widget_button_text: "Start Chat"
      };

      const { data: orgData, error: orgError } = await supabase
        .from("organizations")
        .insert(organizationData)
        .select("*")
        .single();

      if (orgError) {
        console.error('[SignUp] ❌ Organization creation failed:', orgError.message);
        throw new Error(`Failed to create organization: ${orgError.message}`);
      }

      if (!orgData) {
        console.error('[SignUp] ❌ No organization data returned');
        throw new Error("Failed to create organization - no data returned");
      }

      createdOrgId = orgData.id;
      console.log('[SignUp] ✅ Organization created successfully:', createdOrgId);

      // STEP 3: Create Agent Record
      console.log('[SignUp] Step 3: Creating agent record...');
      
      const agentData = {
        user_id: createdUserId,
        display_name: name.trim(),
        email: email.toLowerCase().trim(),
        online_status: "OFFLINE",
        org_id: createdOrgId,
        role: "OWNER"
      };

      const { data: agentRecord, error: agentError } = await supabase
        .from("agents")
        .insert(agentData)
        .select("*")
        .single();

      if (agentError) {
        console.error('[SignUp] ❌ Agent creation failed:', agentError.message);
        throw new Error(`Failed to create agent: ${agentError.message}`);
      }

      if (!agentRecord) {
        console.error('[SignUp] ❌ No agent data returned');
        throw new Error("Failed to create agent - no data returned");
      }

      createdAgentId = agentRecord.id;
      console.log('[SignUp] ✅ Agent created successfully:', createdAgentId);

      // STEP 4: Create Role (non-critical)
      console.log('[SignUp] Step 4: Creating role permissions...');
      try {
        const roleData = {
          org_id: createdOrgId,
          role_key: "OWNER",
          permissions: {
            "agents:read": true, "agents:write": true, "agents:delete": true,
            "customers:read": true, "customers:write": true, "customers:delete": true,
            "conversations:read": true, "conversations:write": true, "conversations:delete": true,
            "messages:read": true, "messages:write": true, "messages:delete": true,
            "settings:read": true, "settings:write": true
          }
        };

        const { data: roleRecord, error: roleError } = await supabase
          .from("roles")
          .insert(roleData)
          .select("*")
          .single();

        if (roleError) {
          console.warn('[SignUp] ⚠️ Role creation failed (non-critical):', roleError.message);
        } else if (roleRecord) {
          console.log('[SignUp] ✅ Role created successfully:', roleRecord.id);

          // STEP 5: Create Role Assignment (non-critical)
          try {
            const assignmentData = {
              org_id: createdOrgId,
              agent_id: createdAgentId,
              role_id: roleRecord.id,
            };

            const { error: assignmentError } = await supabase
              .from("agent_role_assignments")
              .insert(assignmentData);

            if (assignmentError) {
              console.warn('[SignUp] ⚠️ Role assignment failed (non-critical):', assignmentError.message);
            } else {
              console.log('[SignUp] ✅ Role assignment created successfully');
            }
          } catch (assignmentError) {
            console.warn('[SignUp] ⚠️ Role assignment error (non-critical):', assignmentError);
          }
        }
      } catch (roleError) {
        console.warn('[SignUp] ⚠️ Role creation error (non-critical):', roleError);
      }

      // STEP 6: Success! Log the complete creation
      console.log('[SignUp] 🎉 SIGNUP COMPLETED SUCCESSFULLY!');
      console.log('[SignUp] Created records:');
      console.log('  • User ID:', createdUserId);
      console.log('  • Organization ID:', createdOrgId);
      console.log('  • Agent ID:', createdAgentId);
      console.log('  • Email:', email.toLowerCase().trim());
      console.log('  • Organization:', organizationName.trim());

      // STEP 7: Clear all caches before redirect
      console.log('[SignUp] Step 7: Clearing all caches...');
      try {
        if (typeof window !== 'undefined') {
          // Clear localStorage
          const localStorageKeys = Object.keys(localStorage);
          localStorageKeys.forEach(key => {
            if (
              key.startsWith('auth_') || 
              key.includes('cache') || 
              key.includes('linquo') ||
              key.includes('supabase') ||
              key.includes('sb-') ||
              key.includes('conversation') ||
              key.includes('message') ||
              key.includes('customer') ||
              key.includes('agent') ||
              key.includes('organization')
            ) {
              localStorage.removeItem(key);
            }
          });

          // Clear sessionStorage
          const sessionStorageKeys = Object.keys(sessionStorage);
          sessionStorageKeys.forEach(key => {
            if (
              key.startsWith('auth_') || 
              key.includes('cache') || 
              key.includes('linquo') ||
              key.includes('supabase') ||
              key.includes('sb-')
            ) {
              sessionStorage.removeItem(key);
            }
          });

          console.log('[SignUp] ✅ Cache cleared successfully');
        }
      } catch (cacheError) {
        console.warn('[SignUp] ⚠️ Cache clearing failed:', cacheError);
      }

      // STEP 8: Redirect with hard refresh
      console.log('[SignUp] Step 8: Redirecting to dashboard...');
      setTimeout(() => {
        window.location.href = '/dashboard';
        window.location.reload();
      }, 500); // Slightly longer delay to ensure all operations complete

    } catch (error) {
      console.error('[SignUp] 💥 SIGNUP FAILED - Starting cleanup...', error);
      
      // Cleanup any created records
      try {
        if (createdAgentId && createdOrgId) {
          console.log('[SignUp] Cleaning up agent record...');
          await supabase.from("agents").delete().eq("id", createdAgentId);
        }
        
        if (createdOrgId) {
          console.log('[SignUp] Cleaning up organization record...');
          await supabase.from("organizations").delete().eq("id", createdOrgId);
        }
        
        if (createdUserId) {
          console.log('[SignUp] Cleaning up auth user...');
          await supabase.auth.admin.deleteUser(createdUserId);
        }
        
        console.log('[SignUp] ✅ Cleanup completed');
      } catch (cleanupError) {
        console.error('[SignUp] ❌ Cleanup failed:', cleanupError);
      }
      
      throw error;
    }
  };

  const signOut = async () => {
    console.log('[Auth] Logout initiated - Step 1: Clearing cache...');
    
    // STEP 1: Clear cache FIRST - before auth signout and navigation
    try {
      // Clear localStorage completely
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('auth_') || 
          key.includes('cache') || 
          key.includes('linquo') ||
          key.includes('supabase') ||
          key.includes('sb-') ||
          key.startsWith('nextjs') ||
          key.includes('conversation') ||
          key.includes('message') ||
          key.includes('customer') ||
          key.includes('agent')
        ) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear sessionStorage as well (including Org ID)
      const orgIdBefore = sessionStorage.getItem('linquo_org_id');
      if (orgIdBefore) {
        console.log('[Auth] 🗑️ Removing Org ID from session storage:', orgIdBefore);
      }
      
      Object.keys(sessionStorage).forEach(key => {
        if (
          key.startsWith('auth_') || 
          key.includes('cache') || 
          key.includes('linquo') ||
          key.includes('supabase') ||
          key.includes('sb-')
        ) {
          sessionStorage.removeItem(key);
        }
      });
      
      console.log('[Auth] ✅ Session storage cleared (Org ID removed)');
      
      // Clear any data cache imports
      const { clearCache } = await import("./useDataCache");
      clearCache();
    } catch {
      // Ignore import errors but still clear basic storage
      console.warn('[Auth] Some cache clearing failed, but continuing with logout');
    }
    
    console.log('[Auth] Step 2: Signing out from Supabase...');
    const supabase = createClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    
    // Clear React state
    setAuthUser({ user: null, agent: null, organization: null });
    setLoading(false);
    setConnectionStatus('disconnected');
    
    console.log('[Auth] Step 3: Redirecting to login and reloading...');
    // STEP 3: Navigate + reload (this ensures completely clean login page)
    window.location.href = '/login';
    window.location.reload();
  };

  return {
    ...authUser,
    loading,
    error,
    connectionStatus,
    signIn,
    signUp,
    signOut,
  };
}