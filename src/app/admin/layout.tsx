import { PropsWithChildren, Suspense } from "react";

export default function AdminLayout({ children }: PropsWithChildren) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </Suspense>
  );
}
