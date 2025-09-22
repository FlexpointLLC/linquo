import { PropsWithChildren, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardBrandColorProvider } from "@/contexts/dashboard-brand-color-context";
import { DynamicMain } from "@/components/dynamic-main";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div>Loading...</div>}>
        <DashboardBrandColorProvider>
          <div className="h-screen grid grid-cols-[56px_1fr]">
            <Sidebar />
            <div className="flex flex-col h-full overflow-hidden">
              <DashboardHeader />
              <Separator />
              <DynamicMain>
                {children}
              </DynamicMain>
            </div>
          </div>
        </DashboardBrandColorProvider>
      </Suspense>
    </ErrorBoundary>
  );
}


