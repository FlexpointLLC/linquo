"use client";

import { useEffect } from "react";

export default function WidgetTestPage() {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    document.head.appendChild(script);

    // Add debugging
    console.log('🔧 Widget test page loaded');
    console.log('📡 Widget script should load from: /widget.js');
    
    // Check if widget container is created
    setTimeout(() => {
      const widget = document.getElementById('ic-widget-root');
      if (widget) {
        console.log('✅ Widget container found:', widget);
        console.log('📏 Widget size:', widget.style.width, 'x', widget.style.height);
      } else {
        console.log('❌ Widget container not found');
      }
    }, 2000);

    return () => {
      // Cleanup: remove widget container if it exists
      const widget = document.getElementById('ic-widget-root');
      if (widget) {
        widget.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">🚀 Linquo Widget Test Page</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
          <h3 className="text-blue-600 font-semibold mb-4">📋 How to Test the Widget:</h3>
          <ul className="space-y-2 text-gray-700">
            <li><strong>Look for the widget</strong> in the bottom-right corner of this page</li>
            <li><strong>Click on the widget</strong> to open the chat interface</li>
            <li><strong>Fill out the form</strong> when it appears (name and email)</li>
            <li><strong>Start chatting</strong> with the support agent</li>
          </ul>
        </div>

        <p className="text-gray-600 mb-6">
          This is a test page to demonstrate the Linquo chat widget. The widget should appear as a 
          <strong> popup in the bottom-right corner</strong>, not as a full-screen page.
        </p>
        
        <div className="mb-6">
          <p className="font-semibold text-gray-800 mb-2">Expected Behavior:</p>
          <ul className="space-y-1 text-gray-600">
            <li>• Widget appears as a 400px × 700px popup</li>
            <li>• Shows Pearl's avatar with online status</li>
            <li>• Contains welcome message and info bubble</li>
            <li>• Has input field with emoji and send icons</li>
            <li>• Shows "Powered by Linquo" branding</li>
          </ul>
        </div>

        <div className="space-y-4 text-gray-600">
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor 
            incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud 
            exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          
          <p>
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu 
            fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in 
            culpa qui officia deserunt mollit anim id est laborum.
          </p>
        </div>

        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Debug Info:</strong> Check the browser console for widget loading messages and any errors.
          </p>
        </div>
      </div>
    </div>
  );
}
