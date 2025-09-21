"use client";

import { useEffect, useState } from "react";

export default function EmbedSimplePage() {
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    script.onload = () => {
      setWidgetLoaded(true);
    };
    script.onerror = () => {
      // Failed to load widget script
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4">Linquo Widget Test</h1>
        
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h2 className="text-lg font-semibold mb-2">Widget Status</h2>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${widgetLoaded ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span>{widgetLoaded ? 'Widget loaded successfully' : 'Loading widget...'}</span>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-blue-800 space-y-1">
            <li>Look for the chat widget button in the bottom-right corner</li>
            <li>Click the button to open the chat widget</li>
            <li>Fill out the customer form</li>
            <li>Click &quot;Start Chat&quot; to begin a conversation</li>
            <li>Test sending messages</li>
          </ol>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Test Message 1</h3>
            <p className="text-gray-600">This is sample content to test the widget behavior.</p>
          </div>
          <div className="bg-white border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Test Message 2</h3>
            <p className="text-gray-600">The widget should appear as a floating button.</p>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Note:</h3>
          <p className="text-yellow-800">
            If you don&apos;t see the widget button, check the browser console for any errors.
            The widget should appear in the bottom-right corner of the page.
          </p>
        </div>
      </div>
    </div>
  );
}
