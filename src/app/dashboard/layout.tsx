import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell } from "lucide-react";
import { ErrorBoundary } from "@/components/error-boundary";
import { RefreshButton } from "@/components/refresh-button";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary>
      <div className="min-h-screen grid grid-cols-[56px_1fr]">
        <Sidebar />
        <div className="flex flex-col">
          <header className="flex items-center gap-3 p-4 border-b">
            <h1 className="text-xl font-semibold mr-auto">Dashboard</h1>
            <div className="hidden md:flex items-center gap-2">
              <Input placeholder="Search..." className="w-64" />
              <Button size="sm" variant="outline">
                <Bell className="h-4 w-4" />
              </Button>
              <RefreshButton />
            </div>
          </header>
          <Separator />
          <main className="p-6">{children}</main>
        </div>
      </div>
    </ErrorBoundary>
  );
}


