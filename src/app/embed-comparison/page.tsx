"use client";

import { useState } from "react";

export default function EmbedComparisonPage() {
  const [orgId, setOrgId] = useState("1");

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Embed Code Comparison</h1>
        
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-2">🎯 New Chatway-Style Approach</h2>
          <p className="text-blue-800 mb-4">
            We&apos;ve updated our embed codes to use the same clean approach as Chatway and other modern chat widgets.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Old Approach */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">Old Approach (Data Attributes)</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
{`<script src="/widget.js" 
        data-org-id="${orgId}" 
        async></script>`}
              </pre>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>❌ Uses data attributes</p>
              <p>❌ More verbose</p>
              <p>❌ Less standard</p>
              <p>❌ Harder to parse</p>
            </div>
          </div>

          {/* New Approach */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-green-200">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <h2 className="text-xl font-semibold text-gray-900">New Approach (URL Parameters)</h2>
              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">RECOMMENDED</span>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
{`<script id="linquo" 
        async="true" 
        src="/widget.js?id=${orgId}"></script>`}
              </pre>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              <p>✅ Uses URL parameters (like Chatway)</p>
              <p>✅ Clean and concise</p>
              <p>✅ Industry standard</p>
              <p>✅ Easy to parse</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Live Demo</h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Organization ID:
            </label>
            <input
              type="text"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
              placeholder="Enter organization ID"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Generated Embed Code:</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <code className="text-sm text-gray-800 font-mono">
                  {`<script id="linquo" async="true" src="/widget.js?id=${orgId}"></script>`}
                </code>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Widget Status:</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✅ Widget will load with Organization ID: <strong>{orgId}</strong>
                </p>
                <p className="text-green-700 text-xs mt-1">
                  All conversations will be created under this organization
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Benefits of the New Approach</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">For Organizations:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Cleaner embed codes</li>
                <li>✅ Easier to copy and paste</li>
                <li>✅ More professional appearance</li>
                <li>✅ Follows industry standards</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">For Developers:</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>✅ Easier to parse URL parameters</li>
                <li>✅ More reliable than data attributes</li>
                <li>✅ Better error handling</li>
                <li>✅ Consistent with other widgets</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Test the Widget</h2>
          <p className="text-gray-600 mb-4">
            The widget below uses the new Chatway-style approach with Organization ID: <strong>{orgId}</strong>
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              💡 <strong>Tip:</strong> Change the Organization ID above to see how different organizations get their own unique embed codes.
            </p>
          </div>
        </div>
      </div>

      {/* Load the widget with the current orgId */}
      <script
        id="linquo"
        async={true}
        src={`/widget.js?id=${orgId}`}
      />
    </div>
  );
}
