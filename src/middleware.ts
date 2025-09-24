import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function middleware(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.next();
    }

    const response = NextResponse.next();
    const { data: { user } } = await supabase.auth.getUser();

    const publicPaths = ['/login', '/signup', '/embed', '/widget.js', '/api/organization', '/api/geolocation', '/'];
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

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
  } catch {
    // If there's any error, proceed without auth check
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};