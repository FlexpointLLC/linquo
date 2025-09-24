'use client'

import { useAuth } from '@/hooks/use-auth'
import { useRouter, usePathname } from 'next/navigation'
import { useRef, useEffect } from 'react'

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const lastRedirect = useRef<string | null>(null)

  useEffect(() => {
    if (loading) return // Don't redirect while loading

    // Define public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/embed']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // Prevent redirect loops by tracking the last redirect
    const redirectKey = `${user ? 'authenticated' : 'unauthenticated'}-${pathname}`
    if (lastRedirect.current === redirectKey) return

    if (!user && !isPublicRoute) {
      // User is not authenticated and trying to access protected route
      lastRedirect.current = redirectKey
      router.replace('/login')
    } else if (user && pathname === '/login') {
      // User is authenticated but on login page, redirect to dashboard
      lastRedirect.current = redirectKey
      router.replace('/dashboard')
    } else if (user && pathname === '/') {
      // User is authenticated and on root, redirect to dashboard
      lastRedirect.current = redirectKey
      router.replace('/dashboard')
    }
  }, [user, loading, pathname, router])

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}