import { DashboardContent } from "@/components/dashboard-content";
import { DashboardWrapper } from "@/components/auth/dashboard-wrapper";
import { ErrorBoundary } from "@/components/error-boundary";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <DashboardWrapper>
      <ErrorBoundary>
        <DashboardContent />
      </ErrorBoundary>
    </DashboardWrapper>
  );
}


