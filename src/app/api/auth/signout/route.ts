import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[Backend API] Signout endpoint called');
  
  try {
    // Create response with expired cookies to delete them
    const response = NextResponse.json({ success: true, message: 'Signed out successfully' });
    
    // Set expired cookies to delete them
    response.cookies.set('sb-vzoteejdvffrdjprfpad-auth-token', '', {
      path: '/',
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    response.cookies.set('sb-vzoteejdvffrdjprfpad-auth-token.0', '', {
      path: '/',
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    response.cookies.set('sb-vzoteejdvffrdjprfpad-auth-token.1', '', {
      path: '/',
      expires: new Date('Thu, 01 Jan 1970 00:00:00 GMT'),
      httpOnly: true,
      secure: true,
      sameSite: 'lax'
    });
    
    console.log('[Backend API] Cookies set to expire, signout complete');
    return response;
    
  } catch (error) {
    console.error('[Backend API] Signout error:', error);
    return NextResponse.json(
      { success: false, error: 'Signout failed' },
      { status: 500 }
    );
  }
}
