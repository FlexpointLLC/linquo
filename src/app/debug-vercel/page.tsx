"use client";

import { useEffect, useState } from "react";

export default function DebugVercelPage() {
  const [debugInfo, setDebugInfo] = useState<Record<string, unknown>>({});

  useEffect(() => {
    const info = {
      // Environment variables
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20) + "..." : "Missing",
      
      // Browser info
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      location: typeof window !== 'undefined' ? window.location.href : 'Server',
      
      // Supabase client test
      supabaseClientTest: 'Testing...'
    };

    // Test Supabase client
    try {
      import('@/lib/supabase-browser').then(({ getSupabaseBrowser }) => {
        const client = getSupabaseBrowser();
        setDebugInfo(prev => ({ ...prev, supabaseClientTest: client ? 'Available' : 'Not available' }));
      }).catch((error) => {
        setDebugInfo(prev => ({ ...prev, supabaseClientTest: `Error: ${error instanceof Error ? error.message : 'Unknown error'}` }));
      });
    } catch (error) {
      info.supabaseClientTest = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    setDebugInfo(info);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Vercel Debug Information
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Environment & Client Status</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Common Issues & Solutions</h2>
          <ul className="space-y-2 text-sm">
            <li>• <strong>Missing Supabase URL/Key:</strong> Check Vercel environment variables</li>
            <li>• <strong>Supabase Client Error:</strong> Check network connectivity and API keys</li>
            <li>• <strong>Browser Compatibility:</strong> Check if browser supports required features</li>
            <li>• <strong>Build Issues:</strong> Check if build completed successfully</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
