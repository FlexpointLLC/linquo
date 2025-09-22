import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Singleton Supabase client to prevent subscription drops
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  // Return existing client if already created
  if (supabaseClient) {
    return supabaseClient;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;
  
  if (!url || !key) {
    console.error("❌ Missing Supabase environment variables");
    return null;
  }
  
  try {
    console.log("🔧 Creating singleton Supabase client");
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      db: {
        schema: 'public',
        // Use Transaction Pooler connection string if available
        ...(dbUrl && { connectionString: dbUrl })
      },
      global: {
        headers: {
          'X-Client-Info': 'linquo-chat-widget'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    
    console.log("✅ Singleton Supabase client created successfully");
    return supabaseClient;
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
    return null;
  }
}


