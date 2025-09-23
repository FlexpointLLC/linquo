import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get client IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = forwarded?.split(',')[0] || realIp || '127.0.0.1';
    
    // For development, use a default location
    if (clientIp === '127.0.0.1' || clientIp === '::1') {
      return NextResponse.json({
        ip_address: clientIp,
        country: 'United States',
        region: 'California',
        city: 'San Francisco',
        postal_code: '94102',
        latitude: 37.7749,
        longitude: -122.4194,
      });
    }
    
    // Use a free IP geolocation service
    // Note: In production, you might want to use a paid service like MaxMind or IPinfo
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,regionName,city,zip,lat,lon,query`);
    
    if (!geoResponse.ok) {
      throw new Error('Geolocation service unavailable');
    }
    
    const geoData = await geoResponse.json();
    
    if (geoData.status === 'fail') {
      throw new Error(geoData.message || 'Geolocation lookup failed');
    }
    
    return NextResponse.json({
      ip_address: geoData.query,
      country: geoData.country,
      region: geoData.regionName,
      city: geoData.city,
      postal_code: geoData.zip,
      latitude: geoData.lat,
      longitude: geoData.lon,
    });
    
  } catch (error) {
    console.error('Geolocation error:', error);
    
    // Return default data on error
    return NextResponse.json({
      ip_address: 'unknown',
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      postal_code: 'Unknown',
      latitude: null,
      longitude: null,
    });
  }
}
