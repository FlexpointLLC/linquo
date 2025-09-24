(function() {
  'use strict';
  
  // Linquo Widget v2.2 - Responsive height fix
  
  // Get the script element to extract the org ID
  var script = document.currentScript || document.querySelector('script[id="linquo"]');
  var orgId = null;
  var brandColor = '#ffffff'; // Default white color
  
  if (script) {
    var src = script.src;
    var match = src.match(/[?&]id=([^&]+)/);
    if (match) {
      orgId = match[1];
    }
  }
  
  if (!orgId) {
    console.error('[Linquo Widget] No organization ID found in script src');
    return;
  }

  // Function to fetch brand color from API
  function fetchBrandColor(orgId, callback, retryCount) {
    retryCount = retryCount || 0;
    var maxRetries = 2;
    var baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://linquochat.vercel.app';
    // Fetching brand color for org
    
    fetch(baseUrl + '/api/organization/' + encodeURIComponent(orgId))
      .then(function(response) {
        // API response received
        if (!response.ok) {
          throw new Error('Network response was not ok: ' + response.status);
        }
        return response.json();
      })
      .then(function(data) {
        if (data.brand_color) {
          brandColor = data.brand_color;
        }
        callback();
      })
      .catch(function(error) {
        if (retryCount < maxRetries) {
          setTimeout(function() {
            fetchBrandColor(orgId, callback, retryCount + 1);
          }, 1000);
        } else {
          callback(); // Continue with default color
        }
      });
  }

  // Function to update bubble color
  function updateBubbleColor(bubble, color) {
    if (bubble) {
      bubble.style.backgroundColor = color;
      bubble.style.boxShadow = '0 4px 12px ' + color + '40';
      // Bubble color updated
    }
  }

  // Fetch brand color and then create widget
  fetchBrandColor(orgId, function() {
    try {
      // Create chat bubble
      var bubble = document.createElement('div');
      bubble.id = 'linquo-chat-bubble';
      bubble.style.cssText = 'position:fixed;bottom:24px;right:24px;width:68px;height:68px;border-radius:50%;background-color:' + brandColor + ';box-shadow:0 4px 12px ' + brandColor + '40;cursor:pointer;z-index:2147483647;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;';
      
      // Creating bubble with brand color
      
      // Add hover effects
      bubble.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.05)';
        this.style.boxShadow = '0 6px 16px ' + brandColor + '60';
      });
      
      bubble.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 12px ' + brandColor + '40';
      });
      
      // Create chat icon (inline SVG for cross-platform compatibility)
      var chatIcon = document.createElement('div');
      chatIcon.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      chatIcon.style.width = '32px';
      chatIcon.style.height = '32px';
      chatIcon.style.color = 'white';
      
      bubble.appendChild(chatIcon);
      
      // Ensure bubble color is properly set
      updateBubbleColor(bubble, brandColor);
      
      // Create widget container (initially hidden)
      var container = document.createElement('div');
      container.id = 'linquo-widget';
      // Main Container: 400px width, 85% of screen height, max 700px
      var viewportHeight = window.innerHeight;
      var containerHeight = Math.min(700, viewportHeight * 0.85); // 85% of viewport height, max 700px
      
      // Container height calculated
      
      container.style.cssText = 'position:fixed;bottom:100px;right:24px;width:400px;height:' + containerHeight + 'px;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2);border:1px solid #e5e7eb;z-index:2147483646;display:none;';
      
      // Create iframe
      var iframe = document.createElement('iframe');
      // Use production URL for external platforms, localhost for development
      var baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://linquochat.vercel.app';
      iframe.src = baseUrl + '/embed?org=' + encodeURIComponent(orgId) + '&site=' + encodeURIComponent(window.location.origin) + '&color=' + encodeURIComponent(brandColor);
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = '0';
      iframe.style.borderRadius = '12px';
      iframe.allow = 'clipboard-write;';
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
          bubble.innerHTML = '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        } else {
          container.style.display = 'none';
          // Change icon back to custom chat SVG
          bubble.innerHTML = '';
          bubble.appendChild(chatIcon);
        }
      }
      
      // Add click event to bubble
      bubble.addEventListener('click', toggleWidget);
      
      // Handle messages from iframe (close widget)
      window.addEventListener('message', function (e) {
        if (!e || !e.data) {
          return;
        }
        if (typeof e.data !== 'object') {
          return;
        }
        
        // Handle close widget message
        if (e.data.type === 'close-widget') {
          isOpen = false;
          container.style.display = 'none';
          // Change icon back to custom chat SVG
          bubble.innerHTML = '';
          bubble.appendChild(chatIcon);
        }
      });
      
      // Add resize listener to update container height (70% of screen)
      window.addEventListener('resize', function() {
        var newViewportHeight = window.innerHeight;
        var newContainerHeight = Math.min(700, newViewportHeight * 0.85); // 85% of viewport height, max 700px
        
        // Container resized
        
        container.style.height = newContainerHeight + 'px';
      });
      
      // Add to page
      document.body.appendChild(bubble);
      document.body.appendChild(container);
      
      // Widget loaded successfully
      
    } catch (err) {
      console.error('[Linquo Widget] failed to load', err);
    }
  });
})();