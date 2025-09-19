"use client";

import { useAuth } from "@/hooks/useAuth";

export function DebugAuth() {
  const { user, agent, organization, loading } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">Auth Debug</h3>
      <div>Loading: {loading ? "true" : "false"}</div>
      <div>User: {user ? "✅" : "❌"}</div>
      <div>Agent: {agent ? "✅" : "❌"}</div>
      <div>Organization: {organization ? "✅" : "❌"}</div>
      {user && <div>User ID: {user.id}</div>}
      {agent && <div>Agent: {agent.name}</div>}
      {organization && <div>Org: {organization.name}</div>}
    </div>
  );
}
