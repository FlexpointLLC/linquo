import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )

  // Handle CORS for embed page
  if (request.nextUrl.pathname.startsWith('/embed')) {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    response.headers.set('X-Frame-Options', 'ALLOWALL')
    response.headers.set('Content-Security-Policy', "frame-ancestors *")
    return response
  }

  // Handle CORS for widget.js
  if (request.nextUrl.pathname === '/widget.js') {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    return response
  }

  try {
    // Refresh session if needed
    const { data: { session } } = await supabase.auth.getSession()

    // Define public routes that don't need auth
    const publicRoutes = [
      '/login',
      '/signup',
      '/embed',
      '/widget.js',
      '/api/organization',
      '/api/geolocation',
      '/demo',
      '/_next',
      '/favicon.ico'
    ]

    // Check if the current route is public
    const isPublicRoute = publicRoutes.some(route => 
      request.nextUrl.pathname.startsWith(route)
    )

    // Handle auth redirects
    if (!session && !isPublicRoute) {
      // No session on protected route - redirect to login
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    // If we have a session, check if the agent record exists
    if (session?.user && !isPublicRoute) {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('user_id', session.user.id)
        .single()

      // If no agent record found, sign out and redirect to login
      if (!agent) {
        await supabase.auth.signOut()
        const redirectUrl = new URL('/login', request.url)
        return NextResponse.redirect(redirectUrl)
      }
    }

    // Don't redirect if already on login/signup
    if (session && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/')) {
      // Has session on login page - redirect to dashboard
      const redirectUrl = new URL('/dashboard', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response

  } catch (error) {
    // On auth error, redirect to login for protected routes
    if (!request.nextUrl.pathname.startsWith('/login')) {
      const redirectUrl = new URL('/login', request.url)
      return NextResponse.redirect(redirectUrl)
    }
    return response
  }
}

// Update matcher to be more specific
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}