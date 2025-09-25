import { PropsWithChildren, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { MobileNavigation } from "@/components/mobile-navigation";
import { ConditionalDashboardHeader, ConditionalSeparator } from "@/components/conditional-dashboard-header";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardBrandColorProvider } from "@/contexts/dashboard-brand-color-context";
import { DynamicMain } from "@/components/dynamic-main";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardBrandColorProvider>
          <div className="h-screen grid grid-cols-1 md:grid-cols-[56px_1fr]">
            <Sidebar className="hidden md:flex" />
            <div className="flex flex-col h-full overflow-hidden">
              <ConditionalDashboardHeader />
              <ConditionalSeparator />
              <DynamicMain>
                {children}
              </DynamicMain>
            </div>
          </div>
          <MobileNavigation />
        </DashboardBrandColorProvider>
      </Suspense>
    </ErrorBoundary>
  );
}


