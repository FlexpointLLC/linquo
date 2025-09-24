"use client";

import { useState, useEffect } from "react";

export default function DemoPage() {
  const [orgId, setOrgId] = useState("");
  const [, setWidgetScript] = useState("");
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Set default organization ID for demo
  useEffect(() => {
    if (isHydrated && !orgId) {
      setOrgId("25750931-edcf-4860-8527-12616916b377"); // Default demo org
    }
  }, [isHydrated, orgId]);

  // Update widget script when orgId changes
  useEffect(() => {
    if (!isHydrated || !orgId) return;
    
    // Use production URL for external platforms, localhost for development
    const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://linquochat.vercel.app';
    const script = `${baseUrl}/widget.js?id=${encodeURIComponent(orgId)}&v=${Date.now()}`;
    setWidgetScript(script);
    
    // Remove existing widget
    const existingScript = document.getElementById("linquo");
    if (existingScript) {
      existingScript.remove();
    }
    
    // Remove existing widget elements
    const existingBubble = document.getElementById("linquo-chat-bubble");
    const existingWidget = document.getElementById("linquo-widget");
    if (existingBubble) existingBubble.remove();
    if (existingWidget) existingWidget.remove();
    
    // Add new widget script
    const newScript = document.createElement("script");
    newScript.id = "linquo";
    newScript.async = true;
    newScript.src = script;
    document.body.appendChild(newScript);
  }, [orgId, isHydrated]);

  const handleOrgIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrgId(e.target.value);
  };

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-5 py-10">
        <div className="text-center text-white mb-16">
          <h1 className="text-5xl font-bold mb-5">🚀 Linquo Chat Widget</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Experience real-time customer support with our beautiful, responsive chat widget. 
            Try it out by looking for the widget in the bottom-right corner!
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-5">💬</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Real-time Chat</h3>
            <p className="text-gray-600">
              Connect with your customers instantly through our fast, reliable chat system 
              powered by Supabase real-time technology.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-5">🎨</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Beautiful Design</h3>
            <p className="text-gray-600">
              Modern, clean interface that matches your brand. Customizable colors, 
              fonts, and styling options available.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-5">📱</div>
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Mobile Responsive</h3>
            <p className="text-gray-600">
              Works perfectly on all devices - desktop, tablet, and mobile. 
              Your customers can chat from anywhere.
            </p>
          </div>
        </div>
        
        <div className="bg-white p-10 rounded-xl shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-5 text-gray-800">🎯 Try the Widget Now!</h2>
          
          {/* Organization ID Input */}
          <div className="bg-yellow-50 p-6 rounded-lg mb-6 border-l-4 border-yellow-500">
            <h4 className="text-yellow-600 font-semibold mb-4">🔧 Test Different Organization IDs:</h4>
            <div className="bg-yellow-100 p-3 rounded mb-4">
              <p className="text-yellow-800 text-sm">
                <strong>Demo Organization:</strong> Flexpoint (Default)
              </p>
              <p className="text-yellow-700 text-xs mt-1">
                This is a public demo. You can test with different organization IDs below.
              </p>
            </div>
            <div className="max-w-md mx-auto">
              <input
                type="text"
                value={orgId}
                onChange={handleOrgIdChange}
                placeholder="Enter Organization ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              />
              <p className="text-yellow-700 text-xs mt-2">
                Paste a different org ID to test how the widget behaves with different organizations
              </p>
              <div className="mt-3 text-left">
                <p className="text-yellow-600 text-xs font-semibold mb-2">Example Organization IDs:</p>
                <div className="space-y-1">
                  <button 
                    onClick={() => setOrgId("25750931-edcf-4860-8527-12616916b377")}
                    className="block w-full text-left text-xs text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 px-2 py-1 rounded"
                  >
                    • 25750931-edcf-4860-8527-12616916b377 (Flexpoint - Default)
                  </button>
                  <button 
                    onClick={() => setOrgId("test-org-123")}
                    className="block w-full text-left text-xs text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 px-2 py-1 rounded"
                  >
                    • test-org-123 (Test)
                  </button>
                  <button 
                    onClick={() => setOrgId("demo-company-456")}
                    className="block w-full text-left text-xs text-yellow-700 hover:text-yellow-900 hover:bg-yellow-100 px-2 py-1 rounded"
                  >
                    • demo-company-456 (Demo)
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Current Store ID Display */}
            <div className="bg-green-50 p-4 rounded-lg mb-6 border-l-4 border-green-500">
              <h4 className="text-green-600 font-semibold mb-2">🏪 Current Store ID:</h4>
              <p className="text-green-800 font-mono text-sm break-all">
                {orgId}
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6 border-l-4 border-blue-500">
              <h4 className="text-blue-600 font-semibold mb-2">💬 Chat Bubble Features:</h4>
              <ul className="text-blue-800 text-sm space-y-1">
                <li>• 68x68px customizable chat bubble</li>
                <li>• Click to open/close widget</li>
                <li>• Icon changes: Chat icon (closed) → X icon (open)</li>
                <li>• Customizable brand color via URL parameter</li>
                <li>• Hover effects and smooth transitions</li>
              </ul>
            </div>
          
          <p className="text-lg text-gray-600 mb-8">
            The Linquo chat widget should appear in the bottom-right corner of this page. 
            Click on it to start chatting!
          </p>
          
          <div className="bg-blue-50 p-6 rounded-lg mb-8 border-l-4 border-blue-500">
            <h4 className="text-blue-600 font-semibold mb-4 text-left">📋 How to Test:</h4>
            <ul className="text-left max-w-md mx-auto text-gray-700 space-y-2">
              <li>• Look for the widget in the bottom-right corner</li>
              <li>• Click to open the chat interface</li>
              <li>• Fill out your name and email</li>
              <li>• Start chatting with Pearl!</li>
            </ul>
          </div>
          
          <p className="text-gray-600">
            <strong>Widget Features:</strong> Pearl&apos;s avatar, welcome message, emoji/GIF/attachment icons, 
            and &quot;Powered by Linquo&quot; branding.
          </p>
        </div>
        
        <div className="text-center text-white mt-16 opacity-80">
          <p>© 2024 Linquo. Built with Next.js, Supabase, and lots of ❤️</p>
        </div>
      </div>
    </div>
  );
}
