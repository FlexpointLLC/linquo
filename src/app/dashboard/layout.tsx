import { PropsWithChildren, Suspense } from "react";
import { Sidebar } from "@/components/sidebar";
import { Separator } from "@/components/ui/separator";
import { ErrorBoundary } from "@/components/error-boundary";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <div className="h-screen grid grid-cols-[56px_1fr]">
        <Sidebar />
        <div className="flex flex-col h-full overflow-hidden">
          <DashboardHeader />
          <Separator />
          <main className="p-6 flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}


