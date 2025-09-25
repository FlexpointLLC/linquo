"use client";

import { useState, useEffect } from "react";
import { useLinquoWidget } from "@/hooks/use-linquo-widget";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Check, AlertCircle, CheckCircle, XCircle } from "lucide-react";

export default function ReactIntegrationGuide() {
  const [orgId, setOrgId] = useState("ad56884b-d717-4004-87c6-089aaca40bd0");
  const [copied, setCopied] = useState("");
  const [widgetStatus, setWidgetStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Use the Linquo widget hook
  const { isLoaded, reload, destroy, isLoading } = useLinquoWidget({
    orgId,
    onLoad: () => {
      console.log("Widget loaded successfully!");
      setWidgetStatus("loaded");
    },
    onError: (error) => {
      console.error("Widget failed to load:", error);
      setWidgetStatus("error");
    }
  });

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(""), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleReload = () => {
    setWidgetStatus("loading");
    reload();
  };

  const handleDestroy = () => {
    setWidgetStatus("loading");
    destroy();
  };

  // Code examples
  const hookExample = `import { useLinquoWidget } from '@/hooks/use-linquo-widget';

function MyApp() {
  const { isLoaded, reload, destroy } = useLinquoWidget({
    orgId: '${orgId}',
    onLoad: () => console.log('Widget loaded!'),
    onError: (error) => console.error('Widget error:', error)
  });

  return (
    <div>
      <h1>My App</h1>
      {isLoaded() && <p>Widget is ready!</p>}
    </div>
  );
}`;

  const useEffectExample = `import { useEffect } from 'react';

function MyApp() {
  useEffect(() => {
    // Set global config (recommended for React)
    window.LinquoConfig = {
      orgId: '${orgId}',
      brandColor: '#000000' // optional
    };

    // Load the script
    const script = document.createElement('script');
    script.id = 'linquo';
    script.async = true;
    script.src = 'http://localhost:3000/widget.js?id=${orgId}';
    document.head.appendChild(script);

    // Cleanup
    return () => {
      if (window.LinquoWidget) {
        window.LinquoWidget.destroy();
      }
      script.remove();
    };
  }, []);

  return <div>My App</div>;
}`;

  const nextjsExample = `// pages/_app.js or app/layout.tsx
import { useEffect } from 'react';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Global widget configuration
    if (typeof window !== 'undefined') {
      window.LinquoConfig = {
        orgId: '${orgId}'
      };
      
      // Load widget script
      const script = document.createElement('script');
      script.src = 'http://localhost:3000/widget.js?id=${orgId}';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  return <Component {...pageProps} />;
}`;

  const troubleshootingSteps = [
    {
      issue: "Widget doesn't appear",
      solution: "Check browser console for errors. Ensure orgId is correct and API is accessible.",
      status: isLoaded() ? "resolved" : "pending"
    },
    {
      issue: "Multiple widgets appear",
      solution: "Use the cleanup function in useEffect or call widget.destroy() before reloading.",
      status: "resolved"
    },
    {
      issue: "SSR/Hydration issues",
      solution: "Use 'use client' directive and check for window object before accessing widget.",
      status: "resolved"
    },
    {
      issue: "Script loading fails",
      solution: "Verify the widget.js URL is accessible and CORS is properly configured.",
      status: widgetStatus === "error" ? "pending" : "resolved"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🚀 React/Next.js Integration Guide
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Learn how to properly integrate the Linquo widget in your React and Next.js applications
          </p>
        </div>

        {/* Widget Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Widget Status
              {widgetStatus === "loaded" && <CheckCircle className="w-6 h-6 text-green-500" />}
              {widgetStatus === "loading" && <AlertCircle className="w-6 h-6 text-yellow-500" />}
              {widgetStatus === "error" && <XCircle className="w-6 h-6 text-red-500" />}
            </CardTitle>
            <CardDescription>
              Current widget state and controls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Badge variant={widgetStatus === "loaded" ? "default" : widgetStatus === "loading" ? "secondary" : "destructive"}>
                {widgetStatus === "loaded" ? "Loaded" : widgetStatus === "loading" ? "Loading" : "Error"}
              </Badge>
              <span className="text-sm text-gray-600">
                Org ID: {orgId}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReload} disabled={isLoading}>
                Reload Widget
              </Button>
              <Button onClick={handleDestroy} variant="outline" disabled={isLoading}>
                Destroy Widget
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="hook" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="hook">React Hook</TabsTrigger>
            <TabsTrigger value="useeffect">useEffect</TabsTrigger>
            <TabsTrigger value="nextjs">Next.js</TabsTrigger>
            <TabsTrigger value="troubleshooting">Troubleshooting</TabsTrigger>
          </TabsList>

          <TabsContent value="hook">
            <Card>
              <CardHeader>
                <CardTitle>Recommended: React Hook Approach</CardTitle>
                <CardDescription>
                  Use our custom hook for the cleanest integration with automatic cleanup
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                      onClick={() => copyToClipboard(hookExample, "hook")}
                    >
                      {copied === "hook" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-sm overflow-x-auto">
                      <code>{hookExample}</code>
                    </pre>
                  </div>
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✅ Benefits:</h4>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Automatic cleanup on component unmount</li>
                      <li>• Built-in error handling and loading states</li>
                      <li>• TypeScript support</li>
                      <li>• Prevents duplicate widgets</li>
                      <li>• Works with React Strict Mode</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="useeffect">
            <Card>
              <CardHeader>
                <CardTitle>Manual useEffect Approach</CardTitle>
                <CardDescription>
                  Direct integration using React's useEffect hook
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                      onClick={() => copyToClipboard(useEffectExample, "useeffect")}
                    >
                      {copied === "useeffect" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-sm overflow-x-auto">
                      <code>{useEffectExample}</code>
                    </pre>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h4>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Always include cleanup function</li>
                      <li>• Set window.LinquoConfig for better reliability</li>
                      <li>• Handle SSR by checking for window object</li>
                      <li>• Use empty dependency array to prevent re-runs</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nextjs">
            <Card>
              <CardHeader>
                <CardTitle>Next.js Integration</CardTitle>
                <CardDescription>
                  Global widget setup in Next.js applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                      onClick={() => copyToClipboard(nextjsExample, "nextjs")}
                    >
                      {copied === "nextjs" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <pre className="text-sm overflow-x-auto">
                      <code>{nextjsExample}</code>
                    </pre>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">💡 Next.js Tips:</h4>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• Use app/layout.tsx for App Router</li>
                      <li>• Use pages/_app.js for Pages Router</li>
                      <li>• Add "use client" directive when needed</li>
                      <li>• Consider loading widget only on specific pages</li>
                      <li>• Use dynamic imports for client-side only code</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="troubleshooting">
            <Card>
              <CardHeader>
                <CardTitle>Troubleshooting Guide</CardTitle>
                <CardDescription>
                  Common issues and their solutions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {troubleshootingSteps.map((step, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {step.status === "resolved" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <AlertCircle className="w-5 h-5 text-yellow-500" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {step.issue}
                          </h4>
                          <p className="text-gray-600 text-sm">
                            {step.solution}
                          </p>
                        </div>
                        <Badge variant={step.status === "resolved" ? "default" : "secondary"}>
                          {step.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">🔍 Debug Information:</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Widget Loaded: {isLoaded() ? "Yes" : "No"}</p>
                    <p>• Is Loading: {isLoading ? "Yes" : "No"}</p>
                    <p>• Status: {widgetStatus}</p>
                    <p>• Org ID: {orgId}</p>
                    <p>• User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent.substring(0, 50) + '...' : 'SSR'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>🎯 Test the Widget</CardTitle>
            <CardDescription>
              The widget should appear in the bottom-right corner of this page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Current Status: {widgetStatus}</p>
                <p className="text-sm text-gray-600">
                  {widgetStatus === "loaded" && "Widget is ready! Look for the chat bubble in the bottom-right corner."}
                  {widgetStatus === "loading" && "Loading widget... Please wait."}
                  {widgetStatus === "error" && "Widget failed to load. Check the console for errors."}
                </p>
              </div>
              <Button onClick={handleReload} disabled={isLoading}>
                {isLoading ? "Loading..." : "Reload Widget"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
