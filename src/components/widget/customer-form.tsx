"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useBrandColor } from "@/contexts/brand-color-context";

interface CustomerFormProps {
  onSubmit: (data: { name: string; email: string }) => Promise<void>;
  loading?: boolean;
}

export function CustomerForm({ onSubmit, loading = false }: CustomerFormProps) {
  const { brandColor } = useBrandColor();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("🚀 Form submit triggered with data:", formData);
    if (!formData.name.trim() || !formData.email.trim()) {
      console.log("❌ Form validation failed - missing name or email");
      return;
    }
    console.log("✅ Form validation passed, calling onSubmit");
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("❌ Error in form submission:", error);
      // Don't break the form if there's an error
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b to-white"
        style={{ 
          background: `linear-gradient(to bottom, ${brandColor}, white)` 
        }}
      ></div>
      
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-10">
        <button 
          className="text-white hover:text-gray-200 transition-colors cursor-pointer p-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔴 Customer form close button clicked");
            console.log("🔴 Window parent:", window.parent);
            console.log("🔴 Window parent !== window:", window.parent !== window);
            console.log("🔴 Window location:", window.location.href);
            
            // Multiple approaches to close the widget
            let closed = false;
            
            // Approach 1: Send message to parent window
            if (window.parent && window.parent !== window) {
              console.log("🔴 Attempting to send close-widget message");
              try {
                window.parent.postMessage({ type: 'close-widget' }, '*');
                console.log("🔴 Message sent successfully");
                closed = true;
              } catch (error) {
                console.error("🔴 Error sending message:", error);
              }
            }
            
                  // Approach 2: Try to access parent document and hide iframe
                  if (!closed) {
                    console.log("🔴 Attempting direct iframe manipulation");
                    try {
                      if (window.parent && window.parent.document) {
                        const iframe = window.parent.document.querySelector('iframe[src*="/embed"]') as HTMLIFrameElement;
                        if (iframe) {
                          iframe.style.display = 'none';
                          console.log("🔴 Fallback: Hidden iframe directly");
                          closed = true;
                        }
                      }
                    } catch (fallbackError) {
                      console.error("🔴 Direct iframe manipulation failed:", fallbackError);
                    }
                  }
            
                  // Approach 3: Try to access the widget container
                  if (!closed) {
                    console.log("🔴 Attempting to access widget container");
                    try {
                      if (window.parent && window.parent.document) {
                        const widget = window.parent.document.getElementById('linquo-widget') as HTMLElement;
                        if (widget) {
                          widget.style.display = 'none';
                          console.log("🔴 Fallback: Hidden widget container directly");
                          closed = true;
                        }
                      }
                    } catch (containerError) {
                      console.error("🔴 Container manipulation failed:", containerError);
                    }
                  }
            
                  // Approach 4: Try to trigger the bubble click
                  if (!closed) {
                    console.log("🔴 Attempting to trigger bubble click");
                    try {
                      if (window.parent && window.parent.document) {
                        const bubble = window.parent.document.getElementById('linquo-chat-bubble') as HTMLElement;
                        if (bubble) {
                          bubble.click();
                          console.log("🔴 Fallback: Triggered bubble click");
                          closed = true;
                        }
                      }
                    } catch (bubbleError) {
                      console.error("🔴 Bubble click failed:", bubbleError);
                    }
                  }
            
            if (!closed) {
              console.error("🔴 All close attempts failed");
            }
          }}
          title="Close widget"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      
      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-between p-6">
        {/* Header Text */}
        <div style={{ paddingTop: 'calc(var(--spacing) * 24)', paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: '28px', opacity: 0.7, lineHeight: '120%' }}>
            Hello there
          </h1>
          <h2 className="text-white font-semibold" style={{ fontSize: '28px', opacity: 1.0, lineHeight: '120%', paddingBottom: 'calc(var(--spacing) * 6)' }}>
            How can we help?
          </h2>
        </div>
        
        {/* Form */}
        <div className="space-y-4">
          <Input
            id="name"
            type="text"
            placeholder="Your your name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            disabled={loading}
            className="w-full h-12 px-4 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white transition-all"
            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
          />
          
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            disabled={loading}
            className="w-full h-12 px-4 bg-gray-100 border-0 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white transition-all"
            style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
          />
        </div>
        
        {/* Submit Button and Powered by Text */}
        <div className="space-y-3" style={{ paddingTop: 'calc(var(--spacing) * 68)' }}>
          <form onSubmit={handleSubmit}>
            <Button 
              type="submit" 
              className="w-full h-12 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
            >
              {loading ? "Starting Chat..." : "Start Chat"}
            </Button>
          </form>
          
          <p className="text-center text-gray-500 text-xs">
            Powered by Linquo
          </p>
        </div>
      </div>
    </div>
  );
}
