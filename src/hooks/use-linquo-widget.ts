import { useEffect, useRef } from 'react';

interface LinquoWidgetOptions {
  orgId: string;
  baseUrl?: string;
  brandColor?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LinquoWidget {
  orgId: string;
  brandColor: string;
  reload: (newOrgId: string) => void;
  destroy: () => void;
  isLoaded: () => boolean;
}

declare global {
  interface Window {
    LinquoWidget?: LinquoWidget;
    LinquoWidgetLoaded?: boolean;
    LinquoConfig?: {
      orgId: string;
      brandColor?: string;
    };
  }
}

/**
 * React hook for integrating Linquo widget
 * 
 * @param options Configuration options for the widget
 * @returns Object with widget control methods
 * 
 * @example
 * ```tsx
 * function MyApp() {
 *   const { isLoaded, reload, destroy } = useLinquoWidget({
 *     orgId: 'your-org-id',
 *     onLoad: () => console.log('Widget loaded!'),
 *     onError: (error) => console.error('Widget error:', error)
 *   });
 *   
 *   return <div>My App</div>;
 * }
 * ```
 */
export function useLinquoWidget(options: LinquoWidgetOptions) {
  const { orgId, baseUrl, brandColor, onLoad, onError } = options;
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    // Don't load if already loading or if orgId is not provided
    if (isLoadingRef.current || !orgId) {
      return;
    }

    isLoadingRef.current = true;

    // Set global config for the widget to pick up
    if (typeof window !== 'undefined') {
      window.LinquoConfig = {
        orgId,
        brandColor
      };
    }

    // Function to load the widget script
    const loadWidget = () => {
      // Remove existing script if any
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }

      // Create new script element
      const script = document.createElement('script');
      script.id = 'linquo';
      script.async = true;
      
      // Determine the base URL
      const widgetBaseUrl = baseUrl || (
        typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'http://localhost:3000' 
          : 'https://linquochat.vercel.app'
      );
      
      script.src = `${widgetBaseUrl}/widget.js?id=${encodeURIComponent(orgId)}`;

      // Handle script load
      script.onload = () => {
        console.log('[useLinquoWidget] Script loaded successfully');
        isLoadingRef.current = false;
        onLoad?.();
      };

      // Handle script error
      script.onerror = (event) => {
        console.error('[useLinquoWidget] Script failed to load');
        isLoadingRef.current = false;
        const error = new Error('Failed to load Linquo widget script');
        onError?.(error);
      };

      // Add script to head
      document.head.appendChild(script);
      scriptRef.current = script;
    };

    // Load the widget when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', loadWidget);
    } else {
      loadWidget();
    }

    // Cleanup function
    return () => {
      isLoadingRef.current = false;
      
      // Remove event listener if it was added
      document.removeEventListener('DOMContentLoaded', loadWidget);
      
      // Clean up widget and script
      if (typeof window !== 'undefined' && window.LinquoWidget) {
        window.LinquoWidget.destroy();
      }
      
      if (scriptRef.current) {
        scriptRef.current.remove();
        scriptRef.current = null;
      }
      
      // Clean up global config
      if (typeof window !== 'undefined') {
        delete window.LinquoConfig;
      }
    };
  }, [orgId, baseUrl, brandColor, onLoad, onError]);

  // Widget control methods
  const reload = (newOrgId?: string) => {
    if (typeof window !== 'undefined' && window.LinquoWidget) {
      if (newOrgId) {
        window.LinquoWidget.reload(newOrgId);
      } else {
        window.LinquoWidget.reload(orgId);
      }
    }
  };

  const destroy = () => {
    if (typeof window !== 'undefined' && window.LinquoWidget) {
      window.LinquoWidget.destroy();
    }
  };

  const isLoaded = () => {
    if (typeof window !== 'undefined' && window.LinquoWidget) {
      return window.LinquoWidget.isLoaded();
    }
    return false;
  };

  return {
    isLoaded,
    reload,
    destroy,
    isLoading: isLoadingRef.current
  };
}

/**
 * Utility function to load Linquo widget imperatively
 * Useful for cases where you need to load the widget outside of React lifecycle
 */
export function loadLinquoWidget(options: LinquoWidgetOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const { orgId, baseUrl, brandColor } = options;

    // Set global config
    if (typeof window !== 'undefined') {
      window.LinquoConfig = {
        orgId,
        brandColor
      };
    }

    // Create script element
    const script = document.createElement('script');
    script.id = 'linquo';
    script.async = true;
    
    // Determine the base URL
    const widgetBaseUrl = baseUrl || (
      typeof window !== 'undefined' && window.location.hostname === 'localhost' 
        ? 'http://localhost:3000' 
        : 'https://linquochat.vercel.app'
    );
    
    script.src = `${widgetBaseUrl}/widget.js?id=${encodeURIComponent(orgId)}`;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      reject(new Error('Failed to load Linquo widget script'));
    };

    document.head.appendChild(script);
  });
}
