"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Users2, Settings, UserCog, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "agents", label: "Agents", icon: UserCog },
  { key: "customers", label: "Customers", icon: Users2 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const params = useSearchParams();
  const active = params.get("tab") ?? "chats";
  const { agent, organization, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // Force redirect to login page
      window.location.href = "/login";
        } catch {
          // Force redirect even if there's an error
          window.location.href = "/login";
        }
  };

  return (
    <aside className="border-r p-2 h-full flex flex-col items-center">
      {/* Organization Logo Placeholder */}
      <div className="h-10 w-10 rounded-md bg-primary flex items-center justify-center mb-3" aria-label="Organization">
        <span className="text-xs font-semibold text-primary-foreground">
          {organization?.name?.charAt(0)?.toUpperCase() || "L"}
        </span>
      </div>
      
      {/* Navigation Items */}
      <nav className="flex flex-col gap-2 w-full flex-1">
        {items.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/dashboard?tab=${key}`}
            className={cn(
              "flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors",
              active === key ? "bg-muted font-medium" : ""
            )}
            aria-label={label}
            title={label}
          >
            <Icon className="h-5 w-5" />
          </Link>
        ))}
      </nav>

      {/* Avatar Menu at Bottom */}
      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {agent?.display_name?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{agent?.display_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{agent?.email || ""}</p>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}


