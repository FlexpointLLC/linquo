import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log("Supabase config:", {
    url: url ? "✅ URL present" : "❌ URL missing",
    key: key ? "✅ Key present" : "❌ Key missing",
    urlValue: url?.substring(0, 20) + "...",
  });
  
  if (!url || !key) {
    console.error("Missing Supabase environment variables");
    return null;
  }
  
  return createClient(url, key, { auth: { persistSession: true } });
}


