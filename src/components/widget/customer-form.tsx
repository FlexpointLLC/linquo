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
        style={{ background: `linear-gradient(to bottom, ${brandColor}, white)` }}
      ></div>
      
      {/* Close Button */}
      <div className="absolute top-4 right-4 z-20">
        <button 
          className="text-white hover:text-gray-200 transition-colors p-1"
          style={{ cursor: 'pointer' }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("🔴 Customer form close button clicked");
            
            // Send message to parent window to close widget
            if (window.parent && window.parent !== window) {
              console.log("🔴 Sending close-widget message to parent");
              try {
                window.parent.postMessage({ type: 'close-widget' }, '*');
                console.log("🔴 Close message sent successfully");
              } catch (error) {
                console.error("🔴 Error sending close message:", error);
              }
            } else {
              console.log("🔴 No parent window found");
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
