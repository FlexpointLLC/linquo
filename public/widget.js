(function() {
  'use strict';
  
  // Linquo Universal Widget v3.1 - Works everywhere with single embed code
  
  // Prevent multiple widget instances globally
  if (window.LinquoWidgetLoaded) {
    console.log('[Linquo Widget] Already loaded, skipping...');
    return;
  }
  
  // Mark as loading immediately
  window.LinquoWidgetLoaded = true;
  
  // Universal script detection that works in ALL environments
  function getOrgIdFromScript() {
    var orgId = null;
    var brandColor = '#ffffff';
    
    // Method 1: document.currentScript (works in static HTML, Framer, Webflow)
    if (document.currentScript && document.currentScript.src) {
      var match = document.currentScript.src.match(/[?&]id=([^&]+)/);
      if (match) {
        orgId = decodeURIComponent(match[1]);
        console.log('[Linquo Widget] Found org ID from currentScript:', orgId);
        return { orgId: orgId, brandColor: brandColor };
      }
    }
    
    // Method 2: Find script by id="linquo" (React/Next.js pattern)
    var linquoScript = document.querySelector('script[id="linquo"]');
    if (linquoScript && linquoScript.src) {
      var match = linquoScript.src.match(/[?&]id=([^&]+)/);
      if (match) {
        orgId = decodeURIComponent(match[1]);
        console.log('[Linquo Widget] Found org ID from linquo script:', orgId);
        return { orgId: orgId, brandColor: brandColor };
      }
    }
    
    // Method 3: Search all scripts for widget.js (comprehensive fallback)
    var allScripts = document.querySelectorAll('script[src*="widget.js"]');
    for (var i = 0; i < allScripts.length; i++) {
      var scriptSrc = allScripts[i].src;
      var match = scriptSrc.match(/[?&]id=([^&]+)/);
      if (match) {
        orgId = decodeURIComponent(match[1]);
        console.log('[Linquo Widget] Found org ID from widget.js script:', orgId);
        return { orgId: orgId, brandColor: brandColor };
      }
    }
    
    // Method 4: Check for global config (React/Next.js helper)
    if (typeof window !== 'undefined' && window.LinquoConfig && window.LinquoConfig.orgId) {
      orgId = window.LinquoConfig.orgId;
      brandColor = window.LinquoConfig.brandColor || brandColor;
      console.log('[Linquo Widget] Found org ID from global config:', orgId);
      return { orgId: orgId, brandColor: brandColor };
    }
    
    // Method 5: Search document head for any linquo scripts (React SSR edge case)
    var headScripts = document.head.querySelectorAll('script[src*="widget.js"], script[src*="linquo"]');
    for (var i = 0; i < headScripts.length; i++) {
      var scriptSrc = headScripts[i].src;
      var match = scriptSrc.match(/[?&]id=([^&]+)/);
      if (match) {
        orgId = decodeURIComponent(match[1]);
        console.log('[Linquo Widget] Found org ID from head script:', orgId);
        return { orgId: orgId, brandColor: brandColor };
      }
    }
    
    console.error('[Linquo Widget] No organization ID found after checking all methods');
    return { orgId: null, brandColor: brandColor };
  }
  
  var config = getOrgIdFromScript();
  var orgId = config.orgId;
  var brandColor = config.brandColor;
  
  if (!orgId) {
    console.error('[Linquo Widget] No organization ID found. Widget will not load.');
    console.log('[Linquo Widget] Make sure your script tag includes ?id=YOUR_ORG_ID');
    console.log('[Linquo Widget] Example: <script src="https://admin.linquo.app/widget.js?id=your-org-id"></script>');
    window.LinquoWidgetLoaded = false; // Allow retry
    return;
  }

  // Enhanced brand color fetching with better error handling
  function fetchBrandColor(orgId, callback, retryCount) {
    retryCount = retryCount || 0;
    var maxRetries = 3;
    
    // Determine base URL dynamically
    var baseUrl = 'https://admin.linquo.app';
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      baseUrl = 'http://localhost:3000';
    }
    
    console.log('[Linquo Widget] Fetching brand color for org:', orgId, 'from:', baseUrl);
    
    // Create AbortController for timeout (with fallback for older browsers)
    var controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    var timeoutId = setTimeout(function() {
      if (controller) controller.abort();
    }, 10000); // 10 second timeout
    
    var fetchOptions = {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    
    if (controller) {
      fetchOptions.signal = controller.signal;
    }
    
    fetch(baseUrl + '/api/organization/' + encodeURIComponent(orgId), fetchOptions)
      .then(function(response) {
        clearTimeout(timeoutId);
        console.log('[Linquo Widget] API response status:', response.status);
        
        if (!response.ok) {
          throw new Error('API response not ok: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        console.log('[Linquo Widget] Organization data received:', data);
        if (data.brand_color) {
          brandColor = data.brand_color;
          console.log('[Linquo Widget] Brand color updated to:', brandColor);
        }
        callback();
      })
      .catch(function(error) {
        clearTimeout(timeoutId);
        console.warn('[Linquo Widget] Brand color fetch attempt', retryCount + 1, 'failed:', error.message);
        
        if (retryCount < maxRetries && error.name !== 'AbortError') {
          var delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log('[Linquo Widget] Retrying in', delay, 'ms...');
          setTimeout(function() {
            fetchBrandColor(orgId, callback, retryCount + 1);
          }, delay);
        } else {
          console.warn('[Linquo Widget] All brand color fetch attempts failed. Using default color:', brandColor);
          callback(); // Continue with default color
        }
      });
  }

  // Clean up any existing widgets (prevent duplicates)
  function cleanupExistingWidgets() {
    var existingBubble = document.getElementById('linquo-chat-bubble');
    var existingWidget = document.getElementById('linquo-widget');
    
    if (existingBubble) {
      console.log('[Linquo Widget] Removing existing bubble');
      existingBubble.remove();
    }
    
    if (existingWidget) {
      console.log('[Linquo Widget] Removing existing widget');
      existingWidget.remove();
    }
  }

  // Create the widget UI
  function createWidget() {
    try {
      console.log('[Linquo Widget] Creating widget with org ID:', orgId, 'and brand color:', brandColor);
      
      // Clean up any existing widgets first
      cleanupExistingWidgets();
      
      // Create chat bubble with enhanced styling
      var bubble = document.createElement('div');
      bubble.id = 'linquo-chat-bubble';
      bubble.style.cssText = [
        'position: fixed',
        'bottom: 24px',
        'right: 24px', 
        'width: 60px',
        'height: 60px',
        'border-radius: 50%',
        'background-color: ' + brandColor,
        'box-shadow: 0 4px 12px ' + brandColor + '40',
        'cursor: pointer',
        'z-index: 2147483647',
        'display: flex',
        'align-items: center',
        'justify-content: center',
        'transition: all 0.2s ease',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      
      // Add hover effects
      bubble.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 16px ' + brandColor + '60';
      });
      
      bubble.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 12px ' + brandColor + '40';
      });
      
      // Create chat icon
      var chatIcon = document.createElement('div');
      chatIcon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      chatIcon.style.cssText = 'width: 32px; height: 32px; color: white; display: flex; align-items: center; justify-content: center;';
      
      bubble.appendChild(chatIcon);
      
      // Create widget container (initially hidden)
      var container = document.createElement('div');
      container.id = 'linquo-widget';
      
      // Calculate responsive height
      var viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 700;
      var containerHeight = Math.min(700, viewportHeight * 0.82);
      
      container.style.cssText = [
        'position: fixed',
        'bottom: 100px',
        'right: 24px',
        'width: 400px',
        'height: ' + containerHeight + 'px',
        'background: white',
        'border-radius: 12px',
        'box-shadow: 0 10px 30px rgba(0,0,0,0.2)',
        'border: 1px solid #e5e7eb',
        'z-index: 2147483646',
        'display: none',
        'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      ].join(';');
      
      // Create iframe
      var iframe = document.createElement('iframe');
      
      // Determine base URL
      var baseUrl = 'https://admin.linquo.app';
      if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        baseUrl = 'http://localhost:3000';
      }
      
      var siteUrl = typeof window !== 'undefined' ? window.location.origin : '';
      iframe.src = baseUrl + '/embed?org=' + encodeURIComponent(orgId) + '&site=' + encodeURIComponent(siteUrl) + '&color=' + encodeURIComponent(brandColor);
      iframe.style.cssText = 'width: 100%; height: 100%; border: 0; border-radius: 12px;';
      iframe.allow = 'clipboard-write';
      iframe.loading = 'lazy';
      
      container.appendChild(iframe);
      
      // Widget state
      var isOpen = false;
      
      // Toggle widget function
      function toggleWidget() {
        isOpen = !isOpen;
        
        if (isOpen) {
          container.style.display = 'block';
          // Change icon to X
          bubble.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: flex; align-items: center; justify-content: center;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
          console.log('[Linquo Widget] Widget opened');
        } else {
          container.style.display = 'none';
          // Change icon back to chat
          bubble.innerHTML = '';
          bubble.appendChild(chatIcon);
          console.log('[Linquo Widget] Widget closed');
        }
      }
      
      // Add click event to bubble
      bubble.addEventListener('click', toggleWidget);
      
      // Handle messages from iframe
      if (typeof window !== 'undefined') {
        window.addEventListener('message', function (e) {
          if (!e || !e.data || typeof e.data !== 'object') {
            return;
          }
          
          try {
            if (e.data.type === 'close-widget') {
              isOpen = false;
              container.style.display = 'none';
              bubble.innerHTML = '';
              bubble.appendChild(chatIcon);
              console.log('[Linquo Widget] Widget closed via message');
            } else if (e.data.type === 'widget-new-message') {
              if (typeof document !== 'undefined') {
                document.title = 'New Message - Linquo';
              }
              console.log('[Linquo Widget] New message received');
            } else if (e.data.type === 'widget-clear-unread') {
              if (typeof document !== 'undefined') {
                document.title = 'Linquo';
              }
              console.log('[Linquo Widget] Unread messages cleared');
            }
          } catch (err) {
            console.warn('[Linquo Widget] Error handling message:', err);
          }
        });
      }
      
      // Add resize listener
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', function() {
          var newViewportHeight = window.innerHeight;
          var newContainerHeight = Math.min(700, newViewportHeight * 0.82);
          container.style.height = newContainerHeight + 'px';
        });
      }
      
      // Add to page when DOM is ready
      function addToPage() {
        if (typeof document !== 'undefined' && document.body) {
          document.body.appendChild(bubble);
          document.body.appendChild(container);
          console.log('[Linquo Widget] Widget added to page successfully');
        } else {
          // DOM not ready, wait and retry
          setTimeout(addToPage, 100);
        }
      }
      
      addToPage();
      
    } catch (err) {
      console.error('[Linquo Widget] Failed to create widget:', err);
      window.LinquoWidgetLoaded = false; // Allow retry
    }
  }

  // Initialize widget with proper timing for all environments
  function initializeWidget() {
    console.log('[Linquo Widget] Initializing widget for org:', orgId);
    
    // Fetch brand color and create widget
    fetchBrandColor(orgId, function() {
      // Handle different document ready states
      if (typeof document === 'undefined') {
        // Server-side rendering, skip
        console.log('[Linquo Widget] Server-side environment detected, skipping');
        return;
      }
      
      if (document.readyState === 'loading') {
        // DOM still loading
        document.addEventListener('DOMContentLoaded', createWidget);
      } else if (document.readyState === 'interactive' || document.readyState === 'complete') {
        // DOM ready or already loaded
        createWidget();
      } else {
        // Fallback
        setTimeout(createWidget, 100);
      }
    });
  }

  // Start initialization
  initializeWidget();

  // Expose global API for programmatic control
  if (typeof window !== 'undefined') {
    window.LinquoWidget = {
      orgId: orgId,
      brandColor: brandColor,
      version: '3.1',
      reload: function(newOrgId) {
        if (newOrgId && newOrgId !== orgId) {
          console.log('[Linquo Widget] Reloading with new org ID:', newOrgId);
          orgId = newOrgId;
          window.LinquoWidgetLoaded = false;
          cleanupExistingWidgets();
          initializeWidget();
        }
      },
      destroy: function() {
        console.log('[Linquo Widget] Destroying widget');
        cleanupExistingWidgets();
        window.LinquoWidgetLoaded = false;
        delete window.LinquoWidget;
      },
      isLoaded: function() {
        return !!document.getElementById('linquo-chat-bubble');
      },
      open: function() {
        var bubble = document.getElementById('linquo-chat-bubble');
        if (bubble) {
          bubble.click();
        }
      },
      close: function() {
        var container = document.getElementById('linquo-widget');
        if (container && container.style.display === 'block') {
          var bubble = document.getElementById('linquo-chat-bubble');
          if (bubble) {
            bubble.click();
          }
        }
      }
    };
  }
  
})();