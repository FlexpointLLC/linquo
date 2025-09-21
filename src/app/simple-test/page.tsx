export default function SimpleTestPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Basic Page Test</h2>
          <p className="text-gray-600 mb-4">
            This is a simple test page to verify the Next.js app is working correctly.
          </p>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Status: ✅ Working</h3>
            <p className="text-green-800">The page is loading successfully!</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Widget Test</h2>
          <p className="text-gray-600 mb-4">
            To test the widget, you can manually add this script to the page:
          </p>
          
          <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm">
            <code>&lt;script src="/widget.js" async&gt;&lt;/script&gt;</code>
          </div>
          
          <p className="text-gray-600 mt-4">
            Or visit: <a href="/embed" className="text-blue-600 hover:underline">/embed</a> or <a href="/demo" className="text-blue-600 hover:underline">/demo</a>
          </p>
        </div>
      </div>
    </div>
  );
}
