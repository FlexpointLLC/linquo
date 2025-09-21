"use client";

import { useEffect, useState } from "react";

export default function OrgWidgetTestPage() {
  const [orgId, setOrgId] = useState("1");

  useEffect(() => {
    // Load the widget script with organization ID (Chatway style)
    const script = document.createElement('script');
    script.id = 'linquo';
    script.src = `/widget.js?id=${orgId}`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup
      document.head.removeChild(script);
    };
  }, [orgId]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Organization Widget Test</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Organization-Specific Widget</h2>
          <p className="text-gray-600 mb-4">
            This page demonstrates how the widget works with organization-specific embed codes.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <h3 className="font-semibold text-blue-900 mb-2">Current Organization ID:</h3>
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
                placeholder="Enter organization ID"
              />
              <span className="text-sm text-gray-600">(Change to test different organizations)</span>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Embed Code Used:</h3>
            <code className="text-sm text-green-800 bg-green-100 px-2 py-1 rounded">
              {`<script id="linquo" async="true" src="/widget.js?id=${orgId}"></script>`}
            </code>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-3 text-gray-600">
            <p>
              <strong>1. Organization ID:</strong> Each organization gets a unique ID (like {orgId})
            </p>
            <p>
              <strong>2. Embed Code:</strong> The embed code includes the organization ID as a data attribute
            </p>
            <p>
              <strong>3. Widget Behavior:</strong> The widget automatically knows which organization it belongs to
            </p>
            <p>
              <strong>4. Customer Creation:</strong> Customers are created under the correct organization
            </p>
            <p>
              <strong>5. Customization:</strong> Each organization can customize their widget appearance
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Instructions</h2>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Look for the chat widget in the bottom-right corner</li>
            <li>Click to open the widget</li>
            <li>Fill out the customer form</li>
            <li>Start chatting - the conversation will be created under organization ID: <strong>{orgId}</strong></li>
            <li>Check the dashboard to see the conversation under the correct organization</li>
          </ol>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Sample Content</h2>
          <p className="text-gray-600 mb-4">
            This is sample content to test how the organization-specific widget behaves on a real website.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Multi-Tenant Architecture</h3>
              <p className="text-sm text-gray-600">
                Each organization has its own isolated data and customization options.
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Scalable Solution</h3>
              <p className="text-sm text-gray-600">
                Support unlimited organizations with unique embed codes and branding.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
