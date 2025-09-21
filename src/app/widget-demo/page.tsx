"use client";

import { useEffect } from "react";

export default function WidgetDemoPage() {
  useEffect(() => {
    // Load the widget script
    const script = document.createElement('script');
    script.src = '/widget.js';
    script.async = true;
    document.head.appendChild(script);

    return () => {
      // Cleanup: remove widget container if it exists
      const widget = document.getElementById('ic-widget-root');
      if (widget) {
        widget.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-5xl font-bold mb-6">🚀 Linquo Chat Widget</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Experience real-time customer support with our beautiful, responsive chat widget. 
            Try it out by looking for the widget in the bottom-right corner!
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-semibold mb-4">Real-time Chat</h3>
            <p className="text-gray-600">
              Connect with your customers instantly through our fast, reliable chat system 
              powered by Supabase real-time technology.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-4">Beautiful Design</h3>
            <p className="text-gray-600">
              Modern, clean interface that matches your brand. Customizable colors, 
              fonts, and styling options available.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-lg text-center">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-semibold mb-4">Mobile Responsive</h3>
            <p className="text-gray-600">
              Works perfectly on all devices - desktop, tablet, and mobile. 
              Your customers can chat from anywhere.
            </p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <h2 className="text-3xl font-bold mb-6">🎯 Try the Widget Now!</h2>
          <p className="text-lg text-gray-600 mb-8">
            The Linquo chat widget should appear in the bottom-right corner of this page. 
            Click on it to start chatting!
          </p>
          
          <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-blue-500 mb-8">
            <h4 className="text-blue-600 font-semibold mb-4">📋 How to Test:</h4>
            <ul className="text-left max-w-md mx-auto space-y-2">
              <li>• Look for the widget in the bottom-right corner</li>
              <li>• Click to open the chat interface</li>
              <li>• Fill out your name and email</li>
              <li>• Start chatting with Pearl!</li>
            </ul>
          </div>
          
          <p className="text-gray-600">
            <strong>Widget Features:</strong> Pearl&apos;s avatar, welcome message, 
            emoji and send icons, and &quot;Powered by Linquo&quot; branding.
          </p>
        </div>

        <div className="text-center text-white mt-16 opacity-80">
          <p>© 2024 Linquo. Built with Next.js, Supabase, and lots of ❤️</p>
        </div>
      </div>
    </div>
  );
}
