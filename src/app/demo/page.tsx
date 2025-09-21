"use client";

export default function DemoPage() {
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
            <strong>Widget Features:</strong> Pearl's avatar, welcome message, emoji/GIF/attachment icons, 
            and "Powered by Linquo" branding.
          </p>
        </div>
        
        <div className="text-center text-white mt-16 opacity-80">
          <p>© 2024 Linquo. Built with Next.js, Supabase, and lots of ❤️</p>
        </div>
      </div>

      {/* Linquo Widget Script */}
      <script async src="/widget.js"></script>
    </div>
  );
}
