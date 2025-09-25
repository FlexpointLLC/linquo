import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('[API] Logout endpoint called - clearing server-side auth');

    const supabase = await createClient();
    
    // Sign out from Supabase (clears server-side session)
    if (supabase) {
      await supabase.auth.signOut();
    }

    // Create response
    const response = NextResponse.json({ success: true, message: 'Logged out successfully' });

    // Clear all possible Supabase auth cookies
    const cookiesToClear = [
      'sb-vzoteejdvffrdjprfpad-auth-token',
      'sb-vzoteejdvffrdjprfpad-auth-token.0',
      'sb-vzoteejdvffrdjprfpad-auth-token.1',
      'sb-vzoteejdvffrdjprfpad-auth-token.2',
      'sb-vzoteejdvffrdjprfpad-auth-token.3',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0), // Expire immediately
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    console.log('[API] ✅ Server-side logout completed, cookies cleared');
    return response;

  } catch (error) {
    console.error('[API] Logout error:', error);
    
    // Still clear cookies even if there's an error
    const response = NextResponse.json({ 
      success: false, 
      message: 'Logout completed with errors',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    // Clear cookies anyway
    const cookiesToClear = [
      'sb-vzoteejdvffrdjprfpad-auth-token',
      'sb-vzoteejdvffrdjprfpad-auth-token.0',
      'sb-vzoteejdvffrdjprfpad-auth-token.1',
      'sb-vzoteejdvffrdjprfpad-auth-token.2',
      'sb-vzoteejdvffrdjprfpad-auth-token.3',
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
    });

    return response;
  }
}
