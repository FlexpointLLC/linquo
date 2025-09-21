(function() {
  'use strict';
  
  // Get the script element to extract the org ID and brand color
  var script = document.currentScript || document.querySelector('script[id="linquo"]');
  var orgId = null;
  var brandColor = '#3B82F6'; // Default blue color (same as widget)
  
  if (script) {
    var src = script.src;
    var match = src.match(/[?&]id=([^&]+)/);
    if (match) {
      orgId = match[1];
    }
    
    // Check for brand color parameter
    var colorMatch = src.match(/[?&]color=([^&]+)/);
    if (colorMatch) {
      brandColor = decodeURIComponent(colorMatch[1]);
    }
  }
  
  if (!orgId) {
    console.error('[Linquo Widget] No organization ID found in script src');
    return;
  }

  try {
    // Create chat bubble
    var bubble = document.createElement('div');
    bubble.id = 'linquo-chat-bubble';
    bubble.style.cssText = 'position:fixed;bottom:24px;right:24px;width:68px;height:68px;border-radius:50%;background-color:' + brandColor + ';box-shadow:0 4px 12px ' + brandColor + '40;cursor:pointer;z-index:999999;display:flex;align-items:center;justify-content:center;transition:all 0.2s ease;';
    
    // Add hover effects
    bubble.addEventListener('mouseenter', function() {
      this.style.transform = 'scale(1.05)';
      this.style.boxShadow = '0 6px 16px ' + brandColor + '60';
    });
    
    bubble.addEventListener('mouseleave', function() {
      this.style.transform = 'scale(1)';
      this.style.boxShadow = '0 4px 12px ' + brandColor + '40';
    });
    
    // Create chat icon (using your custom SVG)
    var chatIcon = document.createElement('img');
    chatIcon.src = '/icons/chat.svg';
    chatIcon.style.width = '32px';
    chatIcon.style.height = '32px';
    chatIcon.style.filter = 'brightness(0) invert(1)'; // Makes the icon white
    
    bubble.appendChild(chatIcon);
    
    // Create widget container (initially hidden)
    var container = document.createElement('div');
    container.id = 'linquo-widget';
    container.style.cssText = 'position:fixed;bottom:100px;right:24px;width:400px;height:700px;background:white;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.2);border:1px solid #e5e7eb;z-index:999998;display:none;';
    
    // Create iframe
    var iframe = document.createElement('iframe');
    iframe.src = '/embed?org=' + encodeURIComponent(orgId) + '&site=' + encodeURIComponent(window.location.origin);
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
      console.log('🔴 Received message:', e.data);
      if (!e || !e.data) return;
      if (typeof e.data !== 'object') return;
      
      // Handle close widget message
      if (e.data.type === 'close-widget') {
        console.log('🔴 Closing widget via message');
        isOpen = false;
        container.style.display = 'none';
        // Change icon back to custom chat SVG
        bubble.innerHTML = '';
        bubble.appendChild(chatIcon);
      }
    });
    
    // Add to page
    document.body.appendChild(bubble);
    document.body.appendChild(container);
    
  } catch (err) {
    console.error('[Linquo Widget] failed to load', err);
  }
})();