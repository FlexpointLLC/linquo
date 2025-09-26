"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Code, Globe, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export function InstallationGuide() {
  const { organization, loading } = useAuth();
  const [copied, setCopied] = useState(false);

  // Generate the embed code (Universal production URL)
  const generateEmbedCode = () => {
    if (!organization?.id) return "";
    
    // Always use production URL for user embed codes
    const baseUrl = 'https://admin.linquo.app';
    
    return `<script id="linquo" async="true" src="${baseUrl}/widget.js?id=${organization.id}"></script>`;
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

  // Show loading state
  if (loading) {
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-8">
          <div className="max-w-4xl w-full space-y-8">
            <div className="text-center space-y-4">
              <div className="h-8 bg-muted rounded w-48 mx-auto animate-pulse"></div>
              <div className="h-4 bg-muted rounded w-96 mx-auto animate-pulse"></div>
            </div>
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
      </div>
    );
  }

  // Show organization required message
  if (!organization) {
    // Auto-clear session when organization is missing (indicating stale auth)
    useEffect(() => {
      const autoClearSession = async () => {
        console.log('[AutoClearSession] Organization missing - clearing stale auth session via backend API...');
        try {
          const response = await fetch('/api/auth/signout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          if (response.ok) {
            localStorage.clear();
            sessionStorage.clear();
            console.log('[AutoClearSession] Backend signout successful, redirecting to login...');
            // Small delay to show the message briefly before redirect
            setTimeout(() => {
              window.location.href = '/login';
            }, 1500);
          } else {
            console.error('[AutoClearSession] Backend signout failed:', response.statusText);
          }
        } catch (error) {
          console.error('[AutoClearSession] Error calling backend signout:', error);
        }
      };

      // Trigger auto-clear after component mounts
      autoClearSession();
    }, []);

    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-8">
          <div className="max-w-4xl w-full">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Session Issue Detected</h2>
              <p className="text-yellow-700 dark:text-yellow-300 mb-4">Clearing stale session and redirecting to login...</p>
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-600"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-center min-h-full p-8">
        <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Welcome to Linquo</h1>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Get started by installing Linquo on your website for <strong>{organization.name}</strong> to start receiving customer conversations
          </p>
        </div>

        {/* Quick Start Steps */}
        <div className="space-y-6">
          {/* Step 1 - Full Width */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="p-3 bg-blue-500/10 rounded-full w-fit flex-shrink-0">
                  <Code className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                
                {/* Title and Description Container */}
                <div className="flex-1">
                  <CardTitle className="text-xl mb-1">1. Copy Embed Code</CardTitle>
                  <CardDescription>
                    Add this script to your website&apos;s HTML
                  </CardDescription>
                </div>
                
                {/* Copy Button */}
                <Button
                  onClick={handleCopy}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2 flex-shrink-0"
                  disabled={!organization?.id}
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4">
                <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                  {generateEmbedCode() || "Loading embed code..."}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Steps 2 & 3 - Side by Side */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="p-3 bg-green-500/10 rounded-full w-fit flex-shrink-0">
                    <Globe className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  
                  {/* Title and Description Container */}
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">2. Add to Website</CardTitle>
                    <CardDescription>
                      Paste the code before the closing &lt;/head&gt; tag
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">WordPress</Badge>
                    <span>Add to theme footer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">HTML</Badge>
                    <span>Paste in &lt;/body&gt; section</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">React</Badge>
                    <span>Add to index.html</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-4">
                  {/* Icon */}
                  <div className="p-3 bg-purple-500/10 rounded-full w-fit flex-shrink-0">
                    <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  
                  {/* Title and Description Container */}
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-1">3. Start Chatting</CardTitle>
                    <CardDescription>
                      Messages will appear here automatically
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Real-time notifications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Multi-agent support</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Customer history</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
