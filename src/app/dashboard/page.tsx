import { DashboardContent } from "@/components/dashboard-content";
import { ErrorBoundary } from "@/components/error-boundary";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <ErrorBoundary>
      <DashboardContent />
    </ErrorBoundary>
  );
}