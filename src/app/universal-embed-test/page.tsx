"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";

export default function UniversalEmbedTest() {
  const [copied, setCopied] = useState(false);
  const [widgetStatus, setWidgetStatus] = useState<"loading" | "loaded" | "error">("loading");
  
  // The universal embed code that should work everywhere
  const universalEmbedCode = `<script id="linquo" async="true" src="http://localhost:3000/widget.js?id=ad56884b-d717-4004-87c6-089aaca40bd0"></script>`;
  
  // Production version
  const productionEmbedCode = `<script id="linquo" async="true" src="https://admin.linquo.app/widget.js?id=ad56884b-d717-4004-87c6-089aaca40bd0"></script>`;

  useEffect(() => {
    // Test the widget loading by injecting the exact same script tag
    const script = document.createElement('script');
    script.id = 'linquo';
    script.async = true;
    script.src = 'http://localhost:3000/widget.js?id=ad56884b-d717-4004-87c6-089aaca40bd0';
    
    script.onload = () => {
      console.log('Universal embed script loaded successfully');
      // Check for widget after a delay
      setTimeout(() => {
        if (window.LinquoWidget && window.LinquoWidget.isLoaded()) {
          setWidgetStatus("loaded");
        } else {
          setWidgetStatus("error");
        }
      }, 2000);
    };
    
    script.onerror = () => {
      console.error('Universal embed script failed to load');
      setWidgetStatus("error");
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup
      if (window.LinquoWidget) {
        window.LinquoWidget.destroy();
      }
      script.remove();
    };
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const testPlatforms = [
    {
      name: "Next.js (Current)",
      status: widgetStatus,
      description: "This page tests the embed code in Next.js App Router"
    },
    {
      name: "React",
      status: "supported",
      description: "Works when added to index.html or using dangerouslySetInnerHTML"
    },
    {
      name: "Framer",
      status: "supported", 
      description: "Add to site settings > Custom Code > End of <head> tag"
    },
    {
      name: "Webflow",
      status: "supported",
      description: "Add to site settings > Custom Code > Head Code"
    },
    {
      name: "WordPress",
      status: "supported",
      description: "Add to theme header.php or use a custom code plugin"
    },
    {
      name: "Shopify",
      status: "supported",
      description: "Add to theme.liquid in the <head> section"
    },
    {
      name: "Static HTML",
      status: "supported",
      description: "Add directly to the <head> section of your HTML"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "loaded": return "bg-green-100 text-green-800";
      case "supported": return "bg-green-100 text-green-800";
      case "loading": return "bg-yellow-100 text-yellow-800";
      case "error": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "loaded": return "✅ Working";
      case "supported": return "✅ Supported";
      case "loading": return "⏳ Loading";
      case "error": return "❌ Error";
      default: return "❓ Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🌍 Universal Embed Code Test
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            One embed code that works everywhere - React, Next.js, Framer, Webflow, and more!
          </p>
        </div>

        {/* Current Test Status */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              Live Test Status
              <Badge className={getStatusColor(widgetStatus)}>
                {getStatusText(widgetStatus)}
              </Badge>
            </CardTitle>
            <CardDescription>
              Testing the universal embed code in this Next.js application
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Current test result:</p>
              {widgetStatus === "loaded" && (
                <p className="text-green-700">✅ Widget loaded successfully! Check the bottom-right corner.</p>
              )}
              {widgetStatus === "loading" && (
                <p className="text-yellow-700">⏳ Widget is loading...</p>
              )}
              {widgetStatus === "error" && (
                <p className="text-red-700">❌ Widget failed to load. Check console for errors.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Universal Embed Code */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🎯 Universal Embed Code</CardTitle>
            <CardDescription>
              Copy this exact code and paste it into the &lt;head&gt; section of any platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Development Version */}
              <div>
                <h4 className="font-medium mb-2">Development (localhost):</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                    onClick={() => copyToClipboard(universalEmbedCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <code className="text-sm break-all">
                    {universalEmbedCode}
                  </code>
                </div>
              </div>

              {/* Production Version */}
              <div>
                <h4 className="font-medium mb-2">Production:</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-200"
                    onClick={() => copyToClipboard(productionEmbedCode)}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <code className="text-sm break-all">
                    {productionEmbedCode}
                  </code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Compatibility */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>🚀 Platform Compatibility</CardTitle>
            <CardDescription>
              The same embed code works across all these platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {testPlatforms.map((platform, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{platform.name}</h4>
                    <Badge className={getStatusColor(platform.status)}>
                      {getStatusText(platform.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    {platform.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Integration Instructions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>📋 How to Use</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Copy the universal embed code above</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Paste it in the &lt;head&gt; section of your website</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>Replace the org ID with your actual organization ID</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium">4</span>
                  <span>The widget will appear automatically!</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🔧 Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Universal compatibility
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Automatic brand color detection
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Responsive design
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Duplicate prevention
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Error handling & retries
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Performance optimized
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Test Links */}
        <Card>
          <CardHeader>
            <CardTitle>🧪 Additional Tests</CardTitle>
            <CardDescription>
              Test the widget in different environments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href="/widget-compatibility-test.html" target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Static HTML Test
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/react-integration-guide" target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  React Guide
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/widget-test" target="_blank" className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Widget Test Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
