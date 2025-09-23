'use client'

import { useAuth } from '@/hooks/use-auth'

export default function AdminPage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      <div className="bg-card p-6 rounded-lg border">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <p className="text-sm text-muted-foreground">
          User: {user?.email || 'Not authenticated'}
        </p>
        <p className="text-sm text-muted-foreground">
          User ID: {user?.id || 'N/A'}
        </p>
      </div>
    </div>
  )
}
