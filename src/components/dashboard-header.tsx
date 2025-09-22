"use client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { ConnectionBadge } from "@/components/connection-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const tabTitles: Record<string, string> = {
  chats: "Conversations",
  agents: "Agents",
  customers: "Customers", 
  settings: "Settings",
  embed: "Embed Code"
};

export function DashboardHeader() {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "chats";
  const title = tabTitles[currentTab] || "Dashboard";

  return (
    <header className="flex items-center gap-3 p-4 border-b flex-shrink-0">
      <h1 className="text-xl font-semibold">{title}</h1>
      <ConnectionBadge />
      <div className="hidden md:flex items-center gap-2 ml-auto">
        <Input placeholder="Search..." className="w-64" />
        <ThemeToggle />
        <Button size="sm" variant="outline">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
