"use client";
import { useState, useEffect } from "react";

export default function WidgetDebugPage() {
  const [customer, setCustomer] = useState<any>(null);
  const [localStorageData, setLocalStorageData] = useState<string | null>(null);

  useEffect(() => {
    // Check localStorage for customer data
    const savedCustomer = localStorage.getItem("linquo_customer");
    setLocalStorageData(savedCustomer);
    
    if (savedCustomer) {
      try {
        setCustomer(JSON.parse(savedCustomer));
      } catch (error) {
        // Error parsing customer data
      }
    }
  }, []);

  const clearCustomer = () => {
    localStorage.removeItem("linquo_customer");
    setCustomer(null);
    setLocalStorageData(null);
    window.location.reload();
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Widget Debug Page</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">LocalStorage Data</h2>
          <pre className="text-sm bg-white p-2 rounded border overflow-auto">
            {localStorageData || "No customer data found"}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Parsed Customer Data</h2>
          <pre className="text-sm bg-white p-2 rounded border overflow-auto">
            {customer ? JSON.stringify(customer, null, 2) : "No customer data"}
          </pre>
        </div>

        <div className="flex gap-4">
          <button
            onClick={clearCustomer}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Clear Customer Data
          </button>
          
          <a
            href="/embed"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Widget
          </a>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>If you see customer data above, click "Clear Customer Data" to reset</li>
            <li>Click "Test Widget" to open the widget</li>
            <li>You should see the customer form (Welcome screen)</li>
            <li>Fill in name and email, then click "Start Chat"</li>
            <li>Check browser console for any errors</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
