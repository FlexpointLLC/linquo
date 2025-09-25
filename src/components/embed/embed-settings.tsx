"use client";

import { useState } from "react";
import { Copy, Check, Code, Globe, Zap, FileText, Layers, Monitor } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function EmbedSettings() {
  const { organization, loading } = useAuth();
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});

  const orgId = organization?.id;

  // Generate the universal embed code for all platforms
  const generateEmbedCode = () => {
    if (!orgId) return "";
    
    const baseUrl = 'https://admin.linquo.app';
    return `<script id="linquo" async="true" src="${baseUrl}/widget.js?id=${orgId}"></script>`;
  };

  const handleCopy = async (platform: string) => {
    let textToCopy = '';
    
    if (platform === 'orgId') {
      textToCopy = orgId || '';
    } else {
      textToCopy = generateEmbedCode();
    }
    
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedStates(prev => ({ ...prev, [platform]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [platform]: false }));
      }, 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedStates(prev => ({ ...prev, [platform]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [platform]: false }));
      }, 2000);
    }
  };

  // Platform configurations
  const platforms = [
    {
      id: 'html',
      name: 'HTML',
      icon: <FileText className="h-4 w-4" />,
      description: 'Standard HTML websites',
      instructions: [
        'Copy the universal embed code below',
        'Paste it before the closing </head> tag on your website',
        'The chat widget will appear in the bottom-right corner',
        'Customers can start chatting immediately'
      ]
    },
    {
      id: 'webflow',
      name: 'Webflow',
      icon: <Globe className="h-4 w-4" />,
      description: 'Webflow projects',
      instructions: [
        'Copy the universal embed code below',
        'Go to your Webflow project settings',
        'Navigate to Custom Code → Head Code',
        'Paste the code and publish your site'
      ]
    },
    {
      id: 'framer',
      name: 'Framer',
      icon: <Layers className="h-4 w-4" />,
      description: 'Framer websites',
      instructions: [
        'Copy the universal embed code below',
        'Open your Framer project',
        'Go to Site Settings → General → Custom Code',
        'Paste in the "End of <head> tag" section'
      ]
    },
    {
      id: 'react',
      name: 'React',
      icon: <Monitor className="h-4 w-4" />,
      description: 'React applications',
      instructions: [
        'Copy the universal embed code below',
        'Paste it in the <head> section of your public/index.html file',
        'Or add it to your index.html template',
        'The widget works universally in all React apps'
      ]
    },
    {
      id: 'next',
      name: 'Next.js',
      icon: <Zap className="h-4 w-4" />,
      description: 'Next.js applications',
      instructions: [
        'Copy the universal embed code below',
        'Paste it in your app/layout.tsx or pages/_document.tsx file',
        'Add it inside the <head> section',
        'The universal widget works perfectly with Next.js'
      ]
    }
  ];

  // Show skeleton loader while loading
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
    return (
      <div className="h-full overflow-y-auto">
        <div className="flex items-center justify-center min-h-full p-8">
          <div className="max-w-4xl w-full">
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-6 text-center">
              <h2 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Organization Required</h2>
              <p className="text-yellow-700 dark:text-yellow-300">You need to be part of an organization to generate embed codes.</p>
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
            <h1 className="text-3xl font-bold text-foreground">Install Linquo Widget</h1>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Choose your platform and get the embed code to install Linquo chat widget on <strong>{organization.name}</strong>
            </p>
          </div>

          {/* Platform Tabs */}
          <Tabs defaultValue="html" className="w-full">
            <TabsList className="grid w-full grid-cols-5 h-auto p-1">
              {platforms.map((platform) => (
                <TabsTrigger 
                  key={platform.id} 
                  value={platform.id} 
                  className="flex flex-col items-center justify-center gap-2 h-16 px-3 py-2 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <div className="flex items-center justify-center">
                    {platform.icon}
                  </div>
                  <span className="text-xs font-medium">{platform.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {platforms.map((platform) => (
              <TabsContent key={platform.id} value={platform.id} className="space-y-6">
                {/* Embed Code Card */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                        {platform.icon}
                      </div>
                      
                      {/* Title & Description */}
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-1">
                          {platform.name} Integration
                        </CardTitle>
                        <CardDescription>
                          {platform.description}
                        </CardDescription>
                      </div>
                      
                      {/* Badge */}
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Universal
                      </Badge>
                      
                      {/* Copy Button */}
                      <Button
                        onClick={() => handleCopy(platform.id)}
                        size="sm"
                        variant="outline"
                        className="flex items-center gap-2 flex-shrink-0"
                        disabled={!organization?.id}
                      >
                        {copiedStates[platform.id] ? (
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
                      <pre className="text-sm text-foreground whitespace-pre-wrap font-mono overflow-x-auto">
                        {generateEmbedCode() || "Loading embed code..."}
                      </pre>
                    </div>
                  </CardContent>
                </Card>

                {/* Installation Instructions Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Code className="h-5 w-5" />
                      How to Install
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {platform.instructions.map((instruction, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex-shrink-0 mt-0.5">
                            {index + 1}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">
                            {instruction}
                          </p>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Organization Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                Organization Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Organization Name</p>
                  <p className="text-lg font-semibold text-foreground">
                    {organization.name}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Organization ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-foreground bg-muted px-3 py-2 rounded-md border flex-1">
                      {orgId}
                    </p>
                    <Button
                      onClick={() => handleCopy('orgId')}
                      size="sm"
                      variant="ghost"
                      className="p-2"
                    >
                      {copiedStates['orgId'] ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
