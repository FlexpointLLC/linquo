import { PropsWithChildren } from "react";
import { Sidebar } from "@/components/sidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Plus } from "lucide-react";

export default function DashboardLayout({ children }: PropsWithChildren) {
  return (
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
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" /> New
            </Button>
          </div>
        </header>
        <Separator />
        <main className="p-0">{children}</main>
      </div>
    </div>
  );
}


