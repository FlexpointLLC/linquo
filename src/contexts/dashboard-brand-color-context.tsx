"use client";
import { createContext, useContext, ReactNode } from "react";

interface DashboardBrandColorContextType {
  brandColor: string;
  isLoading: boolean;
}

const DashboardBrandColorContext = createContext<DashboardBrandColorContextType>({
  brandColor: "#3B82F6", // Default blue for dashboard
  isLoading: false,
});

export function DashboardBrandColorProvider({ children }: { children: ReactNode }) {
  // Dashboard always uses blue brand color
  const brandColor = "#3B82F6";
  const isLoading = false;

  return (
    <DashboardBrandColorContext.Provider value={{ brandColor, isLoading }}>
      {children}
    </DashboardBrandColorContext.Provider>
  );
}

export function useDashboardBrandColor() {
  const context = useContext(DashboardBrandColorContext);
  if (!context) {
    throw new Error("useDashboardBrandColor must be used within a DashboardBrandColorProvider");
  }
  return context;
}
