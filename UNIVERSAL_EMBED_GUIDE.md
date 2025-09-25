# 🌍 Universal Embed Code Guide

## One Code, All Platforms

You only need **ONE embed code** that works everywhere - React, Next.js, Framer, Webflow, and any other platform!

## 🎯 The Universal Embed Code

```html
<script id="linquo" async="true" src="https://admin.linquo.app/widget.js?id=YOUR_ORG_ID"></script>
```

**That's it!** This exact same code works on every platform.

## 🚀 How to Use

### Step 1: Get Your Organization ID
Replace `YOUR_ORG_ID` with your actual organization ID from your Linquo dashboard.

### Step 2: Add to Your Website
Paste the script tag in the `<head>` section of your website. The method varies by platform:

## 📋 Platform-Specific Instructions

### 🔷 **Framer**
1. Go to **Site Settings** → **General** → **Custom Code**
2. Paste the embed code in **End of `<head>` tag**
3. Publish your site

### 🔷 **Webflow**
1. Go to **Site Settings** → **Custom Code**
2. Paste the embed code in **Head Code**
3. Publish your site

### 🔷 **React**
Add to your `public/index.html` in the `<head>` section:
```html
<head>
  <!-- Other head tags -->
  <script id="linquo" async="true" src="https://admin.linquo.app/widget.js?id=YOUR_ORG_ID"></script>
</head>
```

### 🔷 **Next.js**
Add to your `app/layout.tsx` or `pages/_document.js`:

**App Router (app/layout.tsx):**
```tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script 
          id="linquo" 
          async 
          src="https://admin.linquo.app/widget.js?id=YOUR_ORG_ID"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

**Pages Router (_document.js):**
```jsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <script 
          id="linquo" 
          async 
          src="https://admin.linquo.app/widget.js?id=YOUR_ORG_ID"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
```

### 🔷 **WordPress**
1. Go to **Appearance** → **Theme Editor**
2. Edit `header.php` and add the script before `</head>`
3. Or use a plugin like "Insert Headers and Footers"

### 🔷 **Shopify**
1. Go to **Online Store** → **Themes** → **Actions** → **Edit Code**
2. Open `theme.liquid`
3. Add the script in the `<head>` section

### 🔷 **Squarespace**
1. Go to **Settings** → **Advanced** → **Code Injection**
2. Paste the embed code in **Header**

### 🔷 **Static HTML**
Simply add to the `<head>` section:
```html
<!DOCTYPE html>
<html>
<head>
  <script id="linquo" async="true" src="https://admin.linquo.app/widget.js?id=YOUR_ORG_ID"></script>
</head>
<body>
  <!-- Your content -->
</body>
</html>
```

## ✨ Advanced Features

### Programmatic Control
Once loaded, you can control the widget programmatically:

```javascript
// Check if widget is loaded
if (window.LinquoWidget && window.LinquoWidget.isLoaded()) {
  console.log('Widget is ready!');
}

// Open the widget
window.LinquoWidget.open();

// Close the widget
window.LinquoWidget.close();

// Reload with new org ID
window.LinquoWidget.reload('new-org-id');

// Destroy the widget
window.LinquoWidget.destroy();
```

### Global Configuration (Optional)
For advanced use cases, you can set global configuration before loading:

```javascript
window.LinquoConfig = {
  orgId: 'your-org-id',
  brandColor: '#ff0000' // Optional: Override brand color
};
```

## 🔧 How It Works

The universal widget uses advanced detection methods to work across all platforms:

1. **Static HTML/Framer/Webflow**: Uses `document.currentScript`
2. **React/Next.js**: Searches for script by `id="linquo"`
3. **Dynamic Loading**: Scans all widget.js scripts
4. **Global Config**: Checks `window.LinquoConfig`
5. **Fallbacks**: Multiple detection methods ensure compatibility

## 🎨 Customization

### Brand Colors
The widget automatically fetches your organization's brand color from the API. The chat bubble will use your brand color automatically.

### Responsive Design
The widget is fully responsive and adapts to different screen sizes:
- **Desktop**: 400px width, up to 700px height
- **Mobile**: Responsive sizing with proper touch targets

## 🛠️ Troubleshooting

### Widget Not Appearing
1. **Check Organization ID**: Ensure your org ID is correct
2. **Check Console**: Look for error messages in browser console
3. **Verify API**: Test `https://admin.linquo.app/api/organization/YOUR_ORG_ID`
4. **Check Placement**: Ensure script is in `<head>` section

### Multiple Widgets
The widget automatically prevents duplicates, but if you see multiple widgets:
1. Check for duplicate script tags
2. Ensure you're not loading the widget multiple times
3. Use `window.LinquoWidget.destroy()` before reloading

### React/Next.js Issues
If the widget doesn't work in React/Next.js:
1. Ensure the script has `id="linquo"`
2. Check that the script is in the document head
3. Verify the component is client-side rendered
4. Check browser console for errors

## 📊 Browser Support

The universal widget works in all modern browsers:
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🔒 Security

The widget is secure and privacy-focused:
- No tracking cookies
- HTTPS-only in production
- Content Security Policy compatible
- No third-party dependencies

## 📈 Performance

The widget is optimized for performance:
- **Lazy loading**: iframe loads only when needed
- **Small footprint**: ~5KB gzipped
- **Async loading**: Won't block page rendering
- **Caching**: Efficient API caching

## 🆘 Support

If you need help:
1. Check the browser console for errors
2. Test with the debug pages:
   - `/universal-embed-test` (Next.js test)
   - `/universal-embed-demo.html` (Static HTML test)
3. Verify your organization ID is correct
4. Contact support with your org ID and error details

## 🎉 Success!

Once properly installed, you should see:
- A chat bubble in the bottom-right corner
- Your brand color applied to the bubble
- Smooth animations and interactions
- Responsive behavior on all devices

The same embed code works everywhere - no platform-specific modifications needed! 🚀
