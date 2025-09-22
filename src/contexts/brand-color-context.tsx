"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface BrandColorContextType {
  brandColor: string;
  widgetTextLine1: string;
  widgetTextLine2: string;
  showBranding: boolean;
  chatHeaderName: string;
  chatHeaderSubtitle: string;
  buttonText: string;
  isLoading: boolean;
}

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: "#ffffff",
  widgetTextLine1: "Hello there",
  widgetTextLine2: "How can we help?",
  showBranding: true,
  chatHeaderName: "Support Team",
  chatHeaderSubtitle: "Typically replies within 1 min",
  buttonText: "Start Chat",
  isLoading: true,
});

export function BrandColorProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const orgId = params.get("org");
  const [brandColor, setBrandColor] = useState("#ffffff");
  const [widgetTextLine1, setWidgetTextLine1] = useState("Hello there");
  const [widgetTextLine2, setWidgetTextLine2] = useState("How can we help?");
  const [showBranding, setShowBranding] = useState(true);
  const [chatHeaderName, setChatHeaderName] = useState("Support Team");
  const [chatHeaderSubtitle, setChatHeaderSubtitle] = useState("Typically replies within 1 min");
  const [buttonText, setButtonText] = useState("Start Chat");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    // Always fetch fresh brand color from API (no caching)

    // Fetch brand color from API
    const fetchBrandColor = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://linquochat.vercel.app';
        const response = await fetch(`${baseUrl}/api/organization/${encodeURIComponent(orgId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch brand color');
        }
        
        const data = await response.json();
        const color = data.brand_color || "#ffffff";
        const textLine1 = data.widget_text_line1 || "Hello there";
        const textLine2 = data.widget_text_line2 || "How can we help?";
        const branding = data.widget_show_branding !== false; // default to true
        const headerName = data.chat_header_name || "Support Team";
        const headerSubtitle = data.chat_header_subtitle || "Typically replies within 1 min";
        const buttonTextValue = data.widget_button_text || "Start Chat";
        
        console.log("🎨 Fetched widget settings:", { color, textLine1, textLine2, branding, headerName, headerSubtitle, buttonTextValue });
        setBrandColor(color);
        setWidgetTextLine1(textLine1);
        setWidgetTextLine2(textLine2);
        setShowBranding(branding);
        setChatHeaderName(headerName);
        setChatHeaderSubtitle(headerSubtitle);
        setButtonText(buttonTextValue);
        
      } catch (error) {
        console.error("Error fetching widget settings:", error);
        setBrandColor("#ffffff"); // Fallback to white
        setWidgetTextLine1("Hello there");
        setWidgetTextLine2("How can we help?");
        setShowBranding(true);
        setChatHeaderName("Support Team");
        setChatHeaderSubtitle("Typically replies within 1 min");
        setButtonText("Start Chat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandColor();
  }, [orgId]);


  return (
    <BrandColorContext.Provider value={{ brandColor, widgetTextLine1, widgetTextLine2, showBranding, chatHeaderName, chatHeaderSubtitle, buttonText, isLoading }}>
      {children}
    </BrandColorContext.Provider>
  );
}

export function useBrandColor() {
  const context = useContext(BrandColorContext);
  if (!context) {
    throw new Error("useBrandColor must be used within a BrandColorProvider");
  }
  return context;
}
