/**
 * Session Organization ID Utilities
 * 
 * Provides easy access to the current organization ID stored in sessionStorage.
 * The org ID is automatically set during login and cleared during logout.
 */

const LINQUO_ORG_ID_KEY = 'linquo_org_id';

/**
 * Get the current organization ID from session storage
 * @returns Organization ID string or null if not found
 */
export function getSessionOrgId(): string | null {
  if (typeof window === 'undefined') {
    // Return null during SSR
    return null;
  }
  
  try {
    return sessionStorage.getItem(LINQUO_ORG_ID_KEY);
  } catch (error) {
    console.warn('[Session] Failed to get org ID from session storage:', error);
    return null;
  }
}

/**
 * Set the organization ID in session storage
 * @param orgId - Organization ID to store
 */
export function setSessionOrgId(orgId: string): void {
  if (typeof window === 'undefined') {
    // Skip during SSR
    return;
  }
  
  try {
    sessionStorage.setItem(LINQUO_ORG_ID_KEY, orgId);
  } catch (error) {
    console.warn('[Session] Failed to set org ID in session storage:', error);
  }
}

/**
 * Remove the organization ID from session storage
 */
export function clearSessionOrgId(): void {
  if (typeof window === 'undefined') {
    // Skip during SSR
    return;
  }
  
  try {
    sessionStorage.removeItem(LINQUO_ORG_ID_KEY);
  } catch (error) {
    console.warn('[Session] Failed to clear org ID from session storage:', error);
  }
}

/**
 * Check if organization ID exists in session storage
 * @returns true if org ID exists, false otherwise
 */
export function hasSessionOrgId(): boolean {
  return getSessionOrgId() !== null;
}
