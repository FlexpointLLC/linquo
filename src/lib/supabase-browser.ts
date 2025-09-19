import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("Supabase config:", {
    url: url ? "✅ URL present" : "❌ URL missing",
    key: key ? "✅ Key present" : "❌ Key missing",
    urlValue: url?.substring(0, 20) + "...",
    allEnvVars: Object.keys(process.env).filter(k => k.includes('SUPABASE')),
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
    const client = createClient(url, key, { auth: { persistSession: true } });
    console.log("✅ Supabase client created successfully");
    return client;
  } catch (error) {
    console.error("❌ Failed to create Supabase client:", error);
    return null;
  }
}


