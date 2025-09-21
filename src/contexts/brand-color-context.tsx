"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useOrganization";

interface BrandColorContextType {
  brandColor: string;
  isLoading: boolean;
}

const BrandColorContext = createContext<BrandColorContextType>({
  brandColor: "#3B82F6",
  isLoading: true,
});

export function BrandColorProvider({ children }: { children: ReactNode }) {
  const { agent } = useAuth();
  const { organization, loading } = useOrganization(agent?.org_id || null);
  const [brandColor, setBrandColor] = useState("#3B82F6");

  useEffect(() => {
    if (organization?.brand_color) {
      setBrandColor(organization.brand_color);
    } else {
      setBrandColor("#3B82F6"); // Default fallback
    }
  }, [organization?.brand_color]);

  return (
    <BrandColorContext.Provider value={{ brandColor, isLoading: loading }}>
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
