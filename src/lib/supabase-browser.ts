import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const dbUrl = process.env.SUPABASE_DB_URL;
  
  if (!url || !key) {
    return null;
  }
  
  try {
    const client = createClient(url, key, {
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
    return client;
  } catch {
    return null;
  }
}


