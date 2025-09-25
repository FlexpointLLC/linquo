"use client";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Search } from "lucide-react";
import { ConnectionBadge } from "@/components/connection-badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const { user, signOut } = useAuth();

  const handleNotificationClick = () => {
    toast.info("🔔 Notifications feature coming soon!", {
      description: "We're working hard to bring you real-time notifications.",
      duration: 3000,
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="flex items-center gap-3 p-4 border-b flex-shrink-0">
      {/* Mobile Layout */}
      <div className="md:hidden flex items-center justify-between w-full">
        {/* Left: Avatar Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center rounded-lg bg-muted hover:bg-muted/80 transition-colors w-10 h-10 text-xs font-semibold text-muted-foreground">
              {user?.email?.slice(0, 2).toUpperCase() || "U"}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user?.email || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right: Search, Theme, Notifications */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-10 w-10 p-0">
            <Search className="h-4 w-4" />
          </Button>
          <ThemeToggle />
          <Button size="sm" variant="ghost" className="h-10 w-10 p-0" onClick={handleNotificationClick}>
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Layout (Original) */}
      <div className="hidden md:flex items-center gap-3 w-full">
        <h1 className="text-xl font-semibold">{title}</h1>
        <ConnectionBadge />
        <div className="flex items-center gap-2 ml-auto">
          <Input placeholder="Search..." className="w-64" />
          <ThemeToggle />
          <Button size="sm" variant="outline" onClick={handleNotificationClick}>
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
