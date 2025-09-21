"use client";

import { useState } from "react";
import { Copy, Check, Palette, Code } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function EmbedSettings() {
  const { organization } = useAuth();
  const [copied, setCopied] = useState(false);
  const [customization, setCustomization] = useState({
    primaryColor: "#3B82F6",
    borderRadius: "12px",
    position: "bottom-right",
    showBranding: true,
  });

  const orgId = organization?.id;

  // Generate the embed code (Chatway style)
  const generateEmbedCode = () => {
    if (!orgId) return "";
    
    // Always use production URL for embed codes
    const baseUrl = 'https://linquochat.vercel.app';
    
    return `<script id="linquo" async="true" src="${baseUrl}/widget.js?id=${orgId}"></script>`;
  };

  const handleCopy = async () => {
    const embedCode = generateEmbedCode();
    try {
      await navigator.clipboard.writeText(embedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = embedCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCustomizationChange = (key: string, value: string | boolean) => {
    setCustomization(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!organization) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">Organization Required</h2>
          <p className="text-yellow-700">You need to be part of an organization to generate embed codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Embed Code</h1>
        <p className="text-gray-600">
          Generate and customize your chat widget embed code for <strong>{organization.name}</strong>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Embed Code Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Your Embed Code</h2>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                {generateEmbedCode()}
              </pre>
            </div>
            
            <button
              onClick={handleCopy}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Embed Code
                </>
              )}
            </button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">📋 How to Use</h3>
            <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it before the closing <code>&lt;/body&gt;</code> tag on your website</li>
              <li>The chat widget will appear in the bottom-right corner</li>
              <li>Customers can start chatting immediately</li>
            </ol>
          </div>
        </div>

        {/* Customization Section */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Widget Customization</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={customization.primaryColor}
                    onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={customization.primaryColor}
                    onChange={(e) => handleCustomizationChange('primaryColor', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Border Radius
                </label>
                <select
                  value={customization.borderRadius}
                  onChange={(e) => handleCustomizationChange('borderRadius', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="0px">Sharp (0px)</option>
                  <option value="4px">Small (4px)</option>
                  <option value="8px">Medium (8px)</option>
                  <option value="12px">Large (12px)</option>
                  <option value="16px">Extra Large (16px)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position
                </label>
                <select
                  value={customization.position}
                  onChange={(e) => handleCustomizationChange('position', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="showBranding"
                  checked={customization.showBranding}
                  onChange={(e) => handleCustomizationChange('showBranding', e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showBranding" className="text-sm font-medium text-gray-700">
                  Show &quot;Powered by Linquo&quot; branding
                </label>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">🎯 Preview</h3>
            <p className="text-green-800 text-sm">
              Your widget will appear with the selected customization. Changes are applied in real-time.
            </p>
          </div>
        </div>
      </div>

      {/* Organization Info */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Organization Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-600">Organization ID:</span>
            <span className="ml-2 font-mono text-gray-900">{orgId}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Organization Name:</span>
            <span className="ml-2 text-gray-900">{organization.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
