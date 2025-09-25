"use client";

/**
 * Client-side auth error handler
 * Detects expired tokens and forces logout when API calls fail
 */

import { createClient } from "@/lib/supabase/client";

export class AuthErrorHandler {
  private static instance: AuthErrorHandler;
  private logoutInProgress = false;

  static getInstance(): AuthErrorHandler {
    if (!AuthErrorHandler.instance) {
      AuthErrorHandler.instance = new AuthErrorHandler();
    }
    return AuthErrorHandler.instance;
  }

  /**
   * Handle auth-related errors from API calls
   */
  async handleAuthError(error: any, context: string = 'API call') {
    console.log(`[AuthErrorHandler] ${context} failed:`, error);

    // Check if it's an auth-related error
    if (this.isAuthError(error)) {
      console.log(`[AuthErrorHandler] Auth error detected in ${context}, forcing logout...`);
      await this.forceLogout();
      return true;
    }

    return false;
  }

  /**
   * Check if error is auth-related
   */
  private isAuthError(error: any): boolean {
    if (!error) return false;

    // Check for common auth error patterns
    const authErrorMessages = [
      'JWT expired',
      'Invalid JWT',
      'No JWT present',
      'Authentication required',
      'Invalid token',
      'Token expired',
      'Unauthorized',
      'Authentication failed'
    ];

    const errorMessage = error.message || error.error?.message || '';
    const errorCode = error.code || error.status || error.statusCode;

    // Check HTTP status codes
    if (errorCode === 401 || errorCode === 403) {
      return true;
    }

    // Check error messages
    return authErrorMessages.some(msg => 
      errorMessage.toLowerCase().includes(msg.toLowerCase())
    );
  }

  /**
   * Force logout and clear all auth state
   */
  private async forceLogout() {
    if (this.logoutInProgress) {
      console.log('[AuthErrorHandler] Logout already in progress, skipping...');
      return;
    }

    this.logoutInProgress = true;

    try {
      console.log('[AuthErrorHandler] 🚨 FORCING LOGOUT DUE TO AUTH ERROR');

      // Step 1: Clear client-side storage
      this.clearClientStorage();

      // Step 2: Sign out from Supabase
      const supabase = createClient();
      if (supabase) {
        await supabase.auth.signOut();
      }

      // Step 3: Clear server-side cookies by making a request
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch {
        // Ignore if API doesn't exist
      }

      // Step 4: Hard redirect to login
      console.log('[AuthErrorHandler] ✅ Auth state cleared, redirecting to login...');
      
      // Use location.replace to prevent back button issues
      window.location.replace('/login');
      
    } catch (error) {
      console.error('[AuthErrorHandler] Error during force logout:', error);
      // Still redirect even if cleanup fails
      window.location.replace('/login');
    } finally {
      this.logoutInProgress = false;
    }
  }

  /**
   * Clear all client-side storage
   */
  private clearClientStorage() {
    try {
      // Clear localStorage
      Object.keys(localStorage).forEach(key => {
        if (
          key.startsWith('auth_') || 
          key.includes('cache') || 
          key.includes('linquo') ||
          key.includes('supabase') ||
          key.includes('sb-') ||
          key.includes('conversation') ||
          key.includes('message') ||
          key.includes('customer') ||
          key.includes('agent') ||
          key.includes('organization')
        ) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      Object.keys(sessionStorage).forEach(key => {
        if (
          key.startsWith('auth_') || 
          key.includes('cache') || 
          key.includes('linquo') ||
          key.includes('supabase') ||
          key.includes('sb-')
        ) {
          sessionStorage.removeItem(key);
        }
      });

      console.log('[AuthErrorHandler] ✅ Client storage cleared');
    } catch (error) {
      console.warn('[AuthErrorHandler] Failed to clear client storage:', error);
    }
  }

  /**
   * Check if current session is valid
   */
  async validateSession(): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) return false;

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.log('[AuthErrorHandler] Session validation failed:', error.message);
        await this.handleAuthError(error, 'Session validation');
        return false;
      }

      return !!user;
    } catch (error) {
      console.log('[AuthErrorHandler] Session validation error:', error);
      await this.handleAuthError(error, 'Session validation');
      return false;
    }
  }
}

// Create singleton instance
export const authErrorHandler = AuthErrorHandler.getInstance();

/**
 * Wrapper for API calls that automatically handles auth errors
 */
export async function withAuthErrorHandling<T>(
  apiCall: () => Promise<T>,
  context: string = 'API call'
): Promise<T | null> {
  try {
    return await apiCall();
  } catch (error) {
    const handled = await authErrorHandler.handleAuthError(error, context);
    if (handled) {
      return null; // Auth error was handled, return null
    }
    throw error; // Re-throw non-auth errors
  }
}
