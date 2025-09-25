import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    
    // Try to get user and handle token expiry
    const { data: { user }, error } = await supabase.auth.getUser();

    const publicPaths = ['/login', '/signup', '/embed', '/widget.js', '/api/organization', '/api/geolocation', '/'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

    // If there's an auth error (like expired token) and we're not on a public path
    if (error && !isPublicPath) {
      console.log('[Middleware] Auth error detected:', error.message);
      // Clear the auth cookies to force fresh login
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const redirectResponse = NextResponse.redirect(url);
      
      // Clear Supabase auth cookies
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token');
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token.0');
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token.1');
      
      return redirectResponse;
    }

    if (!user && !isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (user && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup' || request.nextUrl.pathname === '/')) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }

    return response;
  } catch (error) {
    console.log('[Middleware] Unexpected error:', error);
    // If there's any unexpected error, redirect to login for protected routes
    const publicPaths = ['/login', '/signup', '/embed', '/widget.js', '/api/organization', '/api/geolocation', '/'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));
    
    if (!isPublicPath) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      const redirectResponse = NextResponse.redirect(url);
      
      // Clear potentially corrupted auth cookies
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token');
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token.0');
      redirectResponse.cookies.delete('sb-vzoteejdvffrdjprfpad-auth-token.1');
      
      return redirectResponse;
    }
    
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};