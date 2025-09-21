"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSearchParams } from "next/navigation";

interface BrandColorContextType {
  brandColor: string;
  isLoading: boolean;
}

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: "#3B82F6",
  isLoading: true,
});

export function BrandColorProvider({ children }: { children: ReactNode }) {
  const params = useSearchParams();
  const orgId = params.get("org");
  const [brandColor, setBrandColor] = useState("#3B82F6");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orgId) {
      setIsLoading(false);
      return;
    }

    // Check if we already have the brand color cached in memory
    const cacheKey = `brand-color-${orgId}`;
    const cachedColor = sessionStorage.getItem(cacheKey);
    
    if (cachedColor) {
      console.log("🎨 Using cached brand color:", cachedColor);
      setBrandColor(cachedColor);
      setIsLoading(false);
      return;
    }

    // Fetch brand color from API
    const fetchBrandColor = async () => {
      try {
        const baseUrl = window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://linquochat.vercel.app';
        const response = await fetch(`${baseUrl}/api/organization/${encodeURIComponent(orgId)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch brand color');
        }
        
        const data = await response.json();
        const color = data.brand_color || "#3B82F6";
        
        console.log("🎨 Fetched brand color:", color);
        setBrandColor(color);
        
        // Cache the color in sessionStorage (cleared on tab close)
        sessionStorage.setItem(cacheKey, color);
        
      } catch (error) {
        console.error("Error fetching brand color:", error);
        setBrandColor("#3B82F6"); // Fallback to default
      } finally {
        setIsLoading(false);
      }
    };

    fetchBrandColor();
  }, [orgId]);

  // Clear cache on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (orgId) {
        const cacheKey = `brand-color-${orgId}`;
        sessionStorage.removeItem(cacheKey);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
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
