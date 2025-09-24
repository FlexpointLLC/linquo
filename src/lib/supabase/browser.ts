import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

let supabaseClient: SupabaseClient | null = null

export function getSupabaseBrowser(): SupabaseClient | null {
  if (supabaseClient) {
    return supabaseClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    console.error("❌ Missing Supabase environment variables")
    return null
  }

  try {
    console.log("🔧 Creating singleton Supabase client")
    supabaseClient = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
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
    })
    
    console.log("✅ Singleton Supabase client created successfully")
    return supabaseClient
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error)
    return null
  }
}
