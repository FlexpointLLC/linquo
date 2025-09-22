"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface BrandColorContextType {
  brandColor: string;
  isLoading: boolean;
}

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: "#3f4ad9",
  isLoading: true,
});

export function BrandColorProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const orgId = params.get("org");
  const [brandColor, setBrandColor] = useState("#3f4ad9");
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
        const color = data.brand_color || "#3f4ad9";
        
        console.log("🎨 Fetched brand color:", color);
        setBrandColor(color);
        
      } catch (error) {
        console.error("Error fetching brand color:", error);
        setBrandColor("#3f4ad9"); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandColor();
  }, [orgId]);


  return (
    <BrandColorContext.Provider value={{ brandColor, isLoading }}>
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
