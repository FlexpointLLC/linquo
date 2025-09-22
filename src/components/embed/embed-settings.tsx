"use client";

import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function EmbedSettings() {
  const { organization, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [orgIdCopied, setOrgIdCopied] = useState(false);

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

  const handleOrgIdCopy = async () => {
    if (!orgId) return;
    try {
      await navigator.clipboard.writeText(orgId);
      setOrgIdCopied(true);
      setTimeout(() => setOrgIdCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = orgId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setOrgIdCopied(true);
      setTimeout(() => setOrgIdCopied(false), 2000);
    }
  };


  // Show skeleton loader while loading
  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="h-8 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        
        <div className="max-w-2xl">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="h-4 bg-gray-200 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
            <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

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
          Generate your chat widget embed code for <strong>{organization.name}</strong>
        </p>
      </div>

      <div className="max-w-2xl mb-8">
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
      </div>

      {/* Organization Info */}
      <div className="max-w-2xl bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-900">Organization Details</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Organization Name</p>
            <p className="text-lg font-semibold text-gray-900">
              {organization.name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Organization ID</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-gray-900 bg-gray-50 px-3 py-2 rounded-md border flex-1">
                {orgId}
              </p>
              <button
                onClick={handleOrgIdCopy}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                title="Copy Organization ID"
              >
                {orgIdCopied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
