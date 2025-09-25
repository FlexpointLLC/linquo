"use client";

import { useState } from "react";
import { Copy, Check, Code } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export function EmbedSettings() {
  const { organization, loading } = useAuth();
  const [copied, setCopied] = useState(false);
  const [orgIdCopied, setOrgIdCopied] = useState(false);

  const orgId = organization?.id;

  // Generate the embed code (Universal production URL)
  const generateEmbedCode = () => {
    if (!orgId) return "";
    
    // Always use production URL for user embed codes
    const baseUrl = 'https://admin.linquo.app';
    
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
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="h-6 bg-muted rounded w-32 mb-4 animate-pulse"></div>
            <div className="bg-muted rounded-lg p-4 mb-4">
              <div className="h-4 bg-muted-foreground/20 rounded w-full mb-2 animate-pulse"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-3/4 animate-pulse"></div>
            </div>
            <div className="h-10 bg-muted rounded w-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Organization Required</h2>
          <p className="text-yellow-700 dark:text-yellow-300">You need to be part of an organization to generate embed codes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Embed Code</h1>
        <p className="text-muted-foreground">
          Generate your chat widget embed code for <strong>{organization.name}</strong>
        </p>
      </div>

      <div className="max-w-2xl mb-8">
        {/* Embed Code Section */}
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold text-foreground">Your Embed Code</h2>
            </div>
            
            <div className="bg-muted rounded-lg p-4 mb-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {generateEmbedCode()}
              </pre>
            </div>
            
            <Button
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-2"
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
            </Button>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">📋 How to Use</h3>
            <ol className="text-blue-700 dark:text-blue-300 text-sm space-y-1 list-decimal list-inside">
              <li>Copy the embed code above</li>
              <li>Paste it before the closing <code>&lt;/body&gt;</code> tag on your website</li>
              <li>The chat widget will appear in the bottom-right corner</li>
              <li>Customers can start chatting immediately</li>
            </ol>
          </div>

        </div>
      </div>

      {/* Organization Info */}
      <div className="max-w-2xl bg-card rounded-lg border border-border p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <h3 className="text-lg font-semibold text-foreground">Organization Details</h3>
        </div>
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Organization Name</p>
            <p className="text-lg font-semibold text-foreground">
              {organization.name}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Organization ID</p>
            <div className="flex items-center gap-2">
              <p className="text-sm font-mono text-foreground bg-muted px-3 py-2 rounded-md border flex-1">
                {orgId}
              </p>
              <button
                onClick={handleOrgIdCopy}
                className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
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
