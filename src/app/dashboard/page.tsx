import { Suspense } from "react";
import { DashboardContent } from "@/components/dashboard-content";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="p-4 flex items-center justify-center">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}


