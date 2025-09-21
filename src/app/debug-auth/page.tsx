"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DebugAuthPage() {
  const { user, agent, organization, loading } = useAuth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Loading State</h2>
          <p>Loading: {loading ? "true" : "false"}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">User</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {user ? JSON.stringify(user, null, 2) : "null"}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Agent</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {agent ? JSON.stringify(agent, null, 2) : "null"}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Organization</h2>
          <pre className="text-sm bg-gray-100 p-2 rounded">
            {organization ? JSON.stringify(organization, null, 2) : "null"}
          </pre>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Environment Variables</h2>
          <p>Supabase URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Not set"}</p>
          <p>Supabase Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"}</p>
        </div>
      </div>
    </div>
  );
}
