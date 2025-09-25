# Linquo Widget Integration Guide

## Overview

The Linquo widget is now fully compatible with React, Next.js, and other modern JavaScript frameworks. This guide covers all integration methods and troubleshooting steps.

## 🚀 Quick Start

### For React/Next.js Applications (Recommended)

#### Method 1: Using the React Hook (Recommended)

```tsx
import { useLinquoWidget } from '@/hooks/use-linquo-widget';

function MyApp() {
  const { isLoaded, reload, destroy } = useLinquoWidget({
    orgId: 'your-org-id',
    onLoad: () => console.log('Widget loaded!'),
    onError: (error) => console.error('Widget error:', error)
  });

  return (
    <div>
      <h1>My App</h1>
      {isLoaded() && <p>Widget is ready!</p>}
    </div>
  );
}
```

#### Method 2: Using useEffect

```tsx
import { useEffect } from 'react';

function MyApp() {
  useEffect(() => {
    // Set global config (recommended for React)
    window.LinquoConfig = {
      orgId: 'your-org-id',
      brandColor: '#000000' // optional
    };

    // Load the script
    const script = document.createElement('script');
    script.id = 'linquo';
    script.async = true;
    script.src = 'https://your-domain.com/widget.js?id=your-org-id';
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (window.LinquoWidget) {
        window.LinquoWidget.destroy();
      }
      script.remove();
    };
  }, []);

  return <div>My App</div>;
}
```

### For Regular HTML/JavaScript

```html
<script id="linquo" async="true" src="https://your-domain.com/widget.js?id=your-org-id"></script>
```

## 🔧 Configuration Options

### Global Configuration (React/Next.js)

```javascript
window.LinquoConfig = {
  orgId: 'your-org-id',      // Required
  brandColor: '#000000'       // Optional: Custom brand color
};
```

### Widget API

The widget exposes a global API for programmatic control:

```javascript
// Check if widget is loaded
window.LinquoWidget.isLoaded()

// Reload with new org ID
window.LinquoWidget.reload('new-org-id')

// Destroy the widget
window.LinquoWidget.destroy()

// Get current org ID
window.LinquoWidget.orgId

// Get current brand color
window.LinquoWidget.brandColor
```

## 📋 Integration Examples

### Next.js App Router

```tsx
// app/layout.tsx
'use client';

import { useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.LinquoConfig = {
        orgId: 'your-org-id'
      };
      
      const script = document.createElement('script');
      script.src = '/widget.js?id=your-org-id';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Next.js Pages Router

```tsx
// pages/_app.js
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.LinquoConfig = {
        orgId: 'your-org-id'
      };
      
      const script = document.createElement('script');
      script.src = '/widget.js?id=your-org-id';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return <Component {...pageProps} />;
}
```

### Vue.js

```vue
<template>
  <div>My Vue App</div>
</template>

<script>
export default {
  mounted() {
    window.LinquoConfig = {
      orgId: 'your-org-id'
    };
    
    const script = document.createElement('script');
    script.src = '/widget.js?id=your-org-id';
    script.async = true;
    document.head.appendChild(script);
  },
  
  beforeUnmount() {
    if (window.LinquoWidget) {
      window.LinquoWidget.destroy();
    }
  }
};
</script>
```

### Angular

```typescript
// app.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  
  ngOnInit() {
    (window as any).LinquoConfig = {
      orgId: 'your-org-id'
    };
    
    const script = document.createElement('script');
    script.src = '/widget.js?id=your-org-id';
    script.async = true;
    document.head.appendChild(script);
  }
  
  ngOnDestroy() {
    if ((window as any).LinquoWidget) {
      (window as any).LinquoWidget.destroy();
    }
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Widget doesn't appear

**Symptoms:**
- No chat bubble in bottom-right corner
- Console error: "No organization ID found"

**Solutions:**
- Verify your org ID is correct
- Check that the widget.js URL is accessible
- Ensure the API endpoint is working: `GET /api/organization/your-org-id`
- Check browser console for error messages

#### 2. Multiple widgets appear

**Symptoms:**
- Multiple chat bubbles on the page
- Widget appears multiple times on route changes

**Solutions:**
- Use the cleanup function in useEffect
- Call `window.LinquoWidget.destroy()` before loading a new widget
- Use the provided React hook which handles cleanup automatically

#### 3. SSR/Hydration issues

**Symptoms:**
- "window is not defined" errors
- Widget doesn't work on first page load

**Solutions:**
- Check for `typeof window !== 'undefined'` before accessing window
- Use `'use client'` directive in Next.js components
- Load widget in useEffect, not during render

#### 4. Script loading fails

**Symptoms:**
- Network errors in console
- Widget script returns 404

**Solutions:**
- Verify the widget.js file exists in your public directory
- Check CORS configuration
- Ensure your server is running and accessible

### Debug Information

To get debug information, check the browser console. The widget logs all important events:

```javascript
// Enable verbose logging
localStorage.setItem('linquo-debug', 'true');

// Check widget status
console.log('Widget loaded:', window.LinquoWidget?.isLoaded());
console.log('Org ID:', window.LinquoWidget?.orgId);
console.log('Brand color:', window.LinquoWidget?.brandColor);
```

## 🎨 Customization

### Brand Color

The widget automatically fetches your organization's brand color from the API. You can also set it manually:

```javascript
window.LinquoConfig = {
  orgId: 'your-org-id',
  brandColor: '#ff0000'  // Custom red color
};
```

### Widget Position

The widget is positioned in the bottom-right corner by default. To customize the position, add CSS:

```css
#linquo-chat-bubble {
  bottom: 20px !important;
  right: 20px !important;
}

#linquo-widget {
  bottom: 90px !important;
  right: 20px !important;
}
```

## 🔒 Security

### Content Security Policy (CSP)

If you're using CSP, add these directives:

```
script-src 'self' your-domain.com;
frame-src 'self' your-domain.com;
connect-src 'self' your-domain.com;
```

### CORS Configuration

Ensure your server allows cross-origin requests for the widget script and API endpoints.

## 📱 Mobile Support

The widget is fully responsive and works on mobile devices. It automatically adjusts its size based on the viewport.

## 🚀 Performance

The widget is designed to be lightweight and performant:

- Lazy loading of the iframe content
- Minimal JavaScript footprint
- Efficient event handling
- Automatic cleanup on page unload

## 📞 Support

For technical support or questions about widget integration:

1. Check the browser console for error messages
2. Visit the integration guide at `/react-integration-guide`
3. Test the widget at `/test-nextjs-integration.html`
4. Contact support with your org ID and error details

## 🔄 Version History

### v3.0 (Current)
- ✅ Full React/Next.js compatibility
- ✅ Enhanced script detection
- ✅ Automatic cleanup and duplicate prevention
- ✅ Better error handling and logging
- ✅ Global configuration support
- ✅ Programmatic API

### v2.2 (Previous)
- Basic widget functionality
- Limited React compatibility
- Manual cleanup required
