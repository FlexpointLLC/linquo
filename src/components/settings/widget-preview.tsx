"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface WidgetPreviewProps {
  brandColor: string;
  textLine1: string;
  textLine2: string;
  iconAlignment: "left" | "right";
  showPoweredBy: boolean;
  chatHeaderName: string;
  chatHeaderSubtitle: string;
  buttonText: string;
}

export function WidgetPreview({ 
  brandColor, 
  textLine1, 
  textLine2, 
  iconAlignment,
  showPoweredBy,
  chatHeaderName,
  chatHeaderSubtitle,
  buttonText
}: WidgetPreviewProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(true);

  const getBubblePosition = () => {
    switch (iconAlignment) {
      case "left": return "bottom-4 left-4";
      case "right": return "bottom-4 right-4";
      default: return "bottom-4 right-4";
    }
  };

  const getWidgetPosition = () => {
    switch (iconAlignment) {
      case "left": return "bottom-[60px] left-4";
      case "right": return "bottom-[60px] right-4";
      default: return "bottom-[60px] right-4";
    }
  };


  return (
    <div className="relative w-full h-[600px] bg-muted rounded-lg border-2 border-dashed border-border overflow-hidden">

      {/* Widget Bubble - Scaled down to fit preview */}
      <div className={`absolute ${getBubblePosition()}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="w-[40px] h-[40px] rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 cursor-pointer flex items-center justify-center"
          style={{ 
            backgroundColor: brandColor,
            boxShadow: `0 2px 8px ${brandColor}40`
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Widget Container - Scaled down to fit preview (240x420px) */}
      {isOpen && (
        <div 
          className={`absolute ${getWidgetPosition()} bg-background rounded-lg shadow-2xl border border-border overflow-hidden`}
          style={{ width: '240px', height: '420px' }}
        >
          {showForm ? (
            /* Form Page - Exact match to your customer form */
            <div className="h-full w-full relative overflow-hidden">
              {/* Gradient Background */}
              <div 
                className="absolute inset-0 bg-gradient-to-b to-white pointer-events-none"
                style={{ background: `linear-gradient(to bottom, ${brandColor}, white)` }}
              ></div>
              
              {/* Close Button */}
              <div className="absolute top-2 right-2 z-20">
                <button 
                  onClick={() => setIsOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Content */}
              <div className="relative z-10 h-full flex flex-col justify-between p-3">
                {/* Header Text and Form Container */}
                <div style={{ paddingTop: '32px', paddingLeft: '8px', paddingRight: '8px' }}>
                {/* Header Text */}
                <div style={{ paddingTop: '26px', paddingLeft: '10px', paddingRight: '10px' }}>
                  <h1 className="text-white font-semibold" style={{ fontSize: '16px', opacity: 0.7, lineHeight: '120%' }}>
                    {textLine1}
                  </h1>
                  <h2 className="text-white font-semibold" style={{ fontSize: '16px', opacity: 1.0, lineHeight: '120%', paddingBottom: '6px' }}>
                    {textLine2}
                  </h2>
                </div>
                  
                  {/* Form */}
                  <div className="space-y-2 mt-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full h-7 px-3 bg-gray-100 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white transition-all text-xs"
                      style={{ '--tw-ring-color': brandColor, borderRadius: '6px' } as React.CSSProperties}
                    />
                    
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="w-full h-7 px-3 bg-gray-100 border-0 text-gray-900 placeholder-gray-500 focus:ring-2 focus:bg-white transition-all text-xs"
                      style={{ '--tw-ring-color': brandColor, borderRadius: '6px' } as React.CSSProperties}
                    />
                  </div>
                </div>
                
                {/* Submit Button and Powered by Text */}
                <div className="space-y-2" style={{ paddingTop: '20px' }}>
                  <button 
                    className="w-full h-7 text-white font-medium transition-colors text-xs"
                    style={{ backgroundColor: brandColor, borderRadius: '6px' }}
                    onClick={() => setShowForm(false)}
                  >
                    {buttonText}
                  </button>
                  
                  {showPoweredBy && (
                    <p className="text-center text-gray-500" style={{ fontSize: '10px' }}>
                      Powered by Linquo
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Chat Page - Scaled down to fit preview */
            <div className="h-full w-full bg-white text-gray-900 flex flex-col">
              {/* Header */}
              <div className="bg-white bg-opacity-80 backdrop-blur-sm border-b border-gray-200 p-2 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button 
                    className="text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={() => setShowForm(true)}
                    title="Back to form"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="relative">
                    <div 
                      className="w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-white text-xs font-medium">S</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white bg-green-400"></div>
                  </div>
                  <div>
                    <div className="font-semibold text-xs text-gray-900">{chatHeaderName}</div>
                    <div className="text-gray-500" style={{ fontSize: '8px' }}>
                      <span>{chatHeaderSubtitle}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button className="text-gray-600 hover:text-gray-800 cursor-pointer">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  <button 
                    className="text-gray-600 hover:text-gray-800 cursor-pointer"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Content area with messages */}
              <div className="overflow-y-auto p-2 pb-3" style={{ height: '338px' }}>
                <div className="space-y-2">
                  {/* Demo Welcome Messages */}
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-white" style={{ fontSize: '10px', fontWeight: '500' }}>P</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 max-w-[160px]">
                      <div className="text-gray-800" style={{ fontSize: '10px' }}>
                        Please share your email with us in case we can&apos;t get back to you right away.
                      </div>
                      <div className="text-gray-500 mt-1" style={{ fontSize: '9px' }}>Agent · 2:30 PM</div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-white" style={{ fontSize: '10px', fontWeight: '500' }}>P</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 max-w-[160px]">
                      <div className="text-gray-800" style={{ fontSize: '10px' }}>
                        {textLine1}
                      </div>
                      <div className="text-gray-500 mt-1" style={{ fontSize: '9px' }}>Agent · 2:31 PM</div>
                    </div>
                  </div>

                  {/* Demo Customer Message */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="rounded-lg p-2 max-w-[160px]" style={{ backgroundColor: brandColor }}>
                      <div className="text-white" style={{ fontSize: '10px' }}>
                        hi
                      </div>
                      <div className="text-white opacity-80 mt-1" style={{ fontSize: '9px' }}>You · 00:27:43</div>
                    </div>
                    <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600" style={{ fontSize: '10px', fontWeight: '500' }}>Y</span>
                    </div>
                  </div>

                  {/* Demo Agent Response */}
                  <div className="flex items-start gap-2">
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                    >
                      <span className="text-white" style={{ fontSize: '10px', fontWeight: '500' }}>P</span>
                    </div>
                    <div className="bg-gray-100 rounded-lg p-2 max-w-[160px]">
                      <div className="text-gray-800" style={{ fontSize: '10px' }}>
                        hello how are you
                      </div>
                      <div className="text-gray-500 mt-1" style={{ fontSize: '9px' }}>Agent · 00:28:01</div>
                    </div>
                  </div>

                  {/* Demo Customer Message */}
                  <div className="flex items-start gap-2 justify-end">
                    <div className="rounded-lg p-2 max-w-[160px]" style={{ backgroundColor: brandColor }}>
                      <div className="text-white" style={{ fontSize: '10px' }}>
                        I need a help
                      </div>
                      <div className="text-white opacity-80 mt-1" style={{ fontSize: '9px' }}>You · 00:28:36</div>
                    </div>
                    <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-gray-600" style={{ fontSize: '10px', fontWeight: '500' }}>Y</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-200 p-2 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                  <button
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: brandColor }}
                  >
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                
                {/* Powered by Linquo */}
                {showPoweredBy && (
                  <div className="text-center mt-1">
                    <span className="text-gray-400" style={{ fontSize: '10px' }}>
                      Powered by <span className="font-medium" style={{ color: brandColor }}>Linquo</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview Label */}
      <div className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full shadow-sm border">
        <span className="text-xs font-medium text-gray-600">Live Preview</span>
      </div>
    </div>
  );
}
