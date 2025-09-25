"use client";

import { useLinquoWidget } from "@/hooks/use-linquo-widget";

export default function WidgetTestPage() {
  const { isLoaded } = useLinquoWidget({
    orgId: 'ad56884b-d717-4004-87c6-089aaca40bd0',
    onLoad: () => console.log('Widget loaded successfully!'),
    onError: (error) => console.error('Widget failed to load:', error)
  });

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Widget Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test the Linquo Widget</h2>
          <p className="text-gray-600 mb-4">
            This page loads the Linquo chat widget. You should see a chat button in the bottom-right corner.
          </p>
          
          <div className="mb-4 p-3 rounded-lg bg-gray-50">
            <p className="font-medium">Widget Status: 
              <span className={`ml-2 px-2 py-1 rounded text-sm ${isLoaded() ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {isLoaded() ? 'Loaded ✓' : 'Loading...'}
              </span>
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside text-blue-800 space-y-1">
              <li>Look for the chat widget button in the bottom-right corner</li>
              <li>Click the button to open the chat widget</li>
              <li>Fill out the customer form with your details</li>
              <li>Click &quot;Start Chat&quot; to begin a conversation</li>
              <li>Test sending messages</li>
            </ol>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Widget Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>Widget script loaded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>Waiting for widget initialization...</span>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Content</h2>
          <p className="text-gray-600 mb-4">
            This is sample content to test the widget behavior on a real page. 
            The widget should appear as a floating button and not interfere with the page content.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Feature 1</h3>
              <p className="text-sm text-gray-600">Sample feature description</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Feature 2</h3>
              <p className="text-sm text-gray-600">Another sample feature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}