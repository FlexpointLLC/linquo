import { createClient } from "@supabase/supabase-js";

console.log("🔧 supabase-browser.ts loaded");

export function getSupabaseBrowser() {
  console.log("🔧 getSupabaseBrowser() called");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("🔧 Supabase config check:", {
    url: url ? "✅ URL present" : "❌ URL missing",
    key: key ? "✅ Key present" : "❌ Key missing",
    urlValue: url?.substring(0, 20) + "...",
    allEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
    nodeEnv: process.env.NODE_ENV,
    isClient: typeof window !== 'undefined',
  });
  
  if (!url || !key) {
    console.error("Missing Supabase environment variables:", {
      url: !!url,
      key: !!key,
      nodeEnv: process.env.NODE_ENV,
    });
    return null;
  }
  
  try {
    console.log("🔧 Attempting to create Supabase client...");
    const client = createClient(url, key, { auth: { persistSession: true } });
    console.log("✅ Supabase client created successfully:", client);
    return client;
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
    console.error("❌ Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return null;
  }
}


