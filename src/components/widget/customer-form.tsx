"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";
import { useBrandColor } from "@/contexts/brand-color-context";
import { collectCustomerData, CustomerData } from "@/lib/customer-data-collector";

interface CustomerFormProps {
  onSubmit: (data: { name: string; email: string; customerData?: CustomerData }) => Promise<void>;
  loading?: boolean;
}

export function CustomerForm({ onSubmit, loading = false }: CustomerFormProps) {
  const { brandColor, widgetTextLine1, widgetTextLine2, showBranding, buttonText } = useBrandColor();
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
    
    console.log("✅ Form validation passed, collecting customer data...");
    try {
      // Collect comprehensive customer data
      const customerData = await collectCustomerData();
      console.log("📊 Collected customer data:", customerData);
      
      await onSubmit({
        ...formData,
        customerData
      });
    } catch (error) {
      console.error("❌ Error in form submission:", error);
      // Fallback to basic data if collection fails
      await onSubmit(formData);
    }
  };

  return (
    <div className="h-full w-full relative overflow-hidden">
      <style jsx>{`
        input::placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
        input::-webkit-input-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
        input::-moz-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
        input:-ms-input-placeholder {
          color: #6b7280 !important;
          opacity: 1 !important;
        }
      `}</style>
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b to-white pointer-events-none"
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
      <div className="relative z-10 h-full flex flex-col p-6">
        {/* Header Text - Fixed at top */}
        <div className="flex-shrink-0" style={{ paddingTop: 'calc(var(--spacing) * 24)', paddingLeft: '16px', paddingRight: '16px' }}>
          <h1 className="text-white font-semibold" style={{ fontSize: '28px', opacity: 0.7, lineHeight: '120%' }}>
            {widgetTextLine1}
          </h1>
          <h2 className="text-white font-semibold" style={{ fontSize: '28px', opacity: 1.0, lineHeight: '120%', paddingBottom: 'calc(var(--spacing) * 6)' }}>
            {widgetTextLine2}
          </h2>
        </div>
        
        {/* Form - Fill the whole middle space */}
        <div className="flex-1 flex flex-col justify-start space-y-4">
          <Input
            id="name"
            type="text"
            placeholder="Enter your name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
            disabled={loading}
            className="w-full h-12 px-4 border-0 rounded-lg text-black placeholder-gray-500 focus:ring-2 transition-all"
            style={{ 
              '--tw-ring-color': brandColor,
              backgroundColor: 'white',
              border: 'none',
              color: 'black',
              '--placeholder-color': '#6b7280'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.setProperty('--placeholder-color', '#6b7280');
            }}
            onBlur={(e) => {
              e.target.style.setProperty('--placeholder-color', '#6b7280');
            }}
          />
          
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
            disabled={loading}
            className="w-full h-12 px-4 border-0 rounded-lg text-black placeholder-gray-500 focus:ring-2 transition-all"
            style={{ 
              '--tw-ring-color': brandColor,
              backgroundColor: 'white',
              border: 'none',
              color: 'black',
              '--placeholder-color': '#6b7280'
            } as React.CSSProperties}
            onFocus={(e) => {
              e.target.style.setProperty('--placeholder-color', '#6b7280');
            }}
            onBlur={(e) => {
              e.target.style.setProperty('--placeholder-color', '#6b7280');
            }}
          />
        </div>
        
        {/* Submit Button and Powered by Text - Fixed at bottom */}
        <div className="flex-shrink-0 space-y-3 pt-8 sm:pt-12 md:pt-16">
          <form onSubmit={handleSubmit}>
            <Button 
              type="submit" 
              className="w-full h-12 text-white font-medium rounded-lg transition-colors"
              style={{ backgroundColor: brandColor }}
              disabled={loading || !formData.name.trim() || !formData.email.trim()}
            >
              {loading ? "Starting Chat..." : buttonText}
            </Button>
          </form>
          
          {showBranding && (
            <p className="text-center text-gray-500 text-xs">
              Powered by <a href="https://linquo.app" target="_blank" rel="noopener noreferrer" className="no-underline text-black hover:text-black">Linquo</a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
