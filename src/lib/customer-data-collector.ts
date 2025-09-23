// Comprehensive customer data collection utility
// Collects device, browser, location, and behavioral data

export interface CustomerData {
  // Device & Browser Information
  user_agent: string;
  browser_name: string;
  browser_version: string;
  os_name: string;
  os_version: string;
  device_type: 'Desktop' | 'Mobile' | 'Tablet';
  screen_resolution: string;
  timezone: string;
  
  // Network & Location Information
  ip_address?: string;
  country?: string;
  region?: string;
  city?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  timezone_offset: string;
  
  // Website Context
  current_url: string;
  page_title: string;
  referrer_url: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  
  // Behavioral Data
  session_id: string;
  session_start: string;
  is_returning: boolean;
  total_visits: number;
  last_visit?: string;
  avg_session_duration?: number;
  
  // Technical Information
  connection_type?: string;
  network_speed?: string;
  page_load_time?: number;
  
  // Privacy & Consent
  gdpr_consent: boolean;
  cookie_consent: boolean;
  privacy_policy_accepted: boolean;
  
  // Additional metadata
  device_fingerprint: string;
  language: string;
  color_depth: number;
  pixel_ratio: number;
}

// Parse User Agent to extract browser and OS information
function parseUserAgent(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  let browser_name = 'Unknown';
  let browser_version = 'Unknown';
  
  if (ua.includes('chrome') && !ua.includes('edg')) {
    browser_name = 'Chrome';
    const match = ua.match(/chrome\/(\d+\.\d+)/);
    if (match) browser_version = match[1];
  } else if (ua.includes('firefox')) {
    browser_name = 'Firefox';
    const match = ua.match(/firefox\/(\d+\.\d+)/);
    if (match) browser_version = match[1];
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser_name = 'Safari';
    const match = ua.match(/version\/(\d+\.\d+)/);
    if (match) browser_version = match[1];
  } else if (ua.includes('edg')) {
    browser_name = 'Edge';
    const match = ua.match(/edg\/(\d+\.\d+)/);
    if (match) browser_version = match[1];
  }
  
  // OS detection
  let os_name = 'Unknown';
  let os_version = 'Unknown';
  
  if (ua.includes('windows')) {
    os_name = 'Windows';
    if (ua.includes('windows nt 10.0')) os_version = '10';
    else if (ua.includes('windows nt 6.3')) os_version = '8.1';
    else if (ua.includes('windows nt 6.2')) os_version = '8';
    else if (ua.includes('windows nt 6.1')) os_version = '7';
  } else if (ua.includes('mac os x')) {
    os_name = 'macOS';
    const match = ua.match(/mac os x (\d+[._]\d+)/);
    if (match) os_version = match[1].replace('_', '.');
  } else if (ua.includes('iphone')) {
    os_name = 'iOS';
    const match = ua.match(/os (\d+[._]\d+)/);
    if (match) os_version = match[1].replace('_', '.');
  } else if (ua.includes('android')) {
    os_name = 'Android';
    const match = ua.match(/android (\d+\.\d+)/);
    if (match) os_version = match[1];
  } else if (ua.includes('linux')) {
    os_name = 'Linux';
  }
  
  return { browser_name, browser_version, os_name, os_version };
}

// Detect device type
function detectDeviceType(): 'Desktop' | 'Mobile' | 'Tablet' {
  if (typeof window === 'undefined') return 'Desktop';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;
  
  if (userAgent.includes('mobile') || userAgent.includes('android') || userAgent.includes('iphone')) {
    return 'Mobile';
  } else if (userAgent.includes('tablet') || userAgent.includes('ipad') || 
             (screenWidth >= 768 && screenWidth <= 1024)) {
    return 'Tablet';
  }
  
  return 'Desktop';
}

// Generate device fingerprint
function generateDeviceFingerprint(): string {
  if (typeof window === 'undefined') return '';
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

// Get UTM parameters from URL
function getUTMParameters() {
  if (typeof window === 'undefined') return {};
  
  const urlParams = new URLSearchParams(window.location.search);
  return {
    utm_source: urlParams.get('utm_source') || undefined,
    utm_campaign: urlParams.get('utm_campaign') || undefined,
    utm_medium: urlParams.get('utm_medium') || undefined,
  };
}

// Get session data from localStorage
function getSessionData() {
  if (typeof window === 'undefined') return { 
    session_id: '', 
    is_returning: false, 
    total_visits: 1, 
    session_start: new Date().toISOString(),
    last_visit: undefined
  };
  
  const sessionId = localStorage.getItem('linquo_session_id') || 
                   'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  
  const lastVisit = localStorage.getItem('linquo_last_visit');
  const totalVisits = parseInt(localStorage.getItem('linquo_total_visits') || '1');
  const isReturning = !!lastVisit;
  
  // Update session data
  localStorage.setItem('linquo_session_id', sessionId);
  localStorage.setItem('linquo_last_visit', new Date().toISOString());
  localStorage.setItem('linquo_total_visits', (totalVisits + 1).toString());
  
  return {
    session_id: sessionId,
    is_returning: isReturning,
    total_visits: totalVisits,
    last_visit: lastVisit || undefined,
    session_start: new Date().toISOString()
  };
}

// Get geolocation data (this will be populated by the server)
async function getGeolocationData(): Promise<Partial<CustomerData>> {
  try {
    // We'll get this from the server-side API
    const response = await fetch('/api/geolocation');
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.log('Geolocation data not available:', error);
  }
  
  return {};
}

// Main function to collect all customer data
export async function collectCustomerData(): Promise<CustomerData> {
  if (typeof window === 'undefined') {
    throw new Error('Customer data collection must run in browser environment');
  }
  
  const userAgent = navigator.userAgent;
  const { browser_name, browser_version, os_name, os_version } = parseUserAgent(userAgent);
  const sessionData = getSessionData();
  const utmParams = getUTMParameters();
  const geolocationData = await getGeolocationData();
  
  const customerData: CustomerData = {
    // Device & Browser Information
    user_agent: userAgent,
    browser_name,
    browser_version,
    os_name,
    os_version,
    device_type: detectDeviceType(),
    screen_resolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    
    // Network & Location Information (from server)
    ...geolocationData,
    timezone_offset: new Date().getTimezoneOffset().toString(),
    
    // Website Context
    current_url: window.location.href,
    page_title: document.title,
    referrer_url: document.referrer,
    ...utmParams,
    
    // Behavioral Data
    session_id: sessionData.session_id,
    session_start: sessionData.session_start,
    is_returning: sessionData.is_returning,
    total_visits: sessionData.total_visits,
    last_visit: sessionData.last_visit,
    
    // Technical Information
    connection_type: (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || 'unknown',
    network_speed: (navigator as Navigator & { connection?: { downlink?: number } }).connection?.downlink?.toString() || 'unknown',
    page_load_time: performance.timing ? 
      performance.timing.loadEventEnd - performance.timing.navigationStart : undefined,
    
    // Privacy & Consent (defaults to false, should be set by user)
    gdpr_consent: false,
    cookie_consent: false,
    privacy_policy_accepted: false,
    
    // Additional metadata
    device_fingerprint: generateDeviceFingerprint(),
    language: navigator.language,
    color_depth: screen.colorDepth,
    pixel_ratio: window.devicePixelRatio || 1,
  };
  
  return customerData;
}

// Function to update consent status
export function updateConsentStatus(consent: {
  gdpr_consent?: boolean;
  cookie_consent?: boolean;
  privacy_policy_accepted?: boolean;
}) {
  if (typeof window === 'undefined') return;
  
  Object.entries(consent).forEach(([key, value]) => {
    if (value !== undefined) {
      localStorage.setItem(`linquo_${key}`, value.toString());
    }
  });
}

// Function to get consent status
export function getConsentStatus() {
  if (typeof window === 'undefined') return { gdpr_consent: false, cookie_consent: false, privacy_policy_accepted: false };
  
  return {
    gdpr_consent: localStorage.getItem('linquo_gdpr_consent') === 'true',
    cookie_consent: localStorage.getItem('linquo_cookie_consent') === 'true',
    privacy_policy_accepted: localStorage.getItem('linquo_privacy_policy_accepted') === 'true',
  };
}
