"use client";

export default function DebugEnvPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Environment Variables Debug</h1>
      <div className="space-y-4">
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
          <p className="text-sm text-gray-600">
            {supabaseUrl ? `✅ ${supabaseUrl.substring(0, 30)}...` : "❌ Missing"}
          </p>
        </div>
        <div>
          <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
          <p className="text-sm text-gray-600">
            {supabaseKey ? `✅ ${supabaseKey.substring(0, 30)}...` : "❌ Missing"}
          </p>
        </div>
        <div>
          <strong>NODE_ENV:</strong>
          <p className="text-sm text-gray-600">{process.env.NODE_ENV}</p>
        </div>
        <div>
          <strong>All SUPABASE env vars:</strong>
          <p className="text-sm text-gray-600">
            {Object.keys(process.env)
              .filter(k => k.includes('SUPABASE'))
              .join(', ') || 'None found'}
          </p>
        </div>
      </div>
    </div>
  );
}
