"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageCircle, Users, Settings2, UserCheck, LogOut, Code2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const items = [
  { key: "chats", label: "Chats", icon: MessageCircle },
  { key: "agents", label: "Agents", icon: UserCheck },
  { key: "customers", label: "Customers", icon: Users },
  { key: "embed", label: "Embed", icon: Code2 },
  { key: "settings", label: "Settings", icon: Settings2 },
];

export function Sidebar() {
  const params = useSearchParams();
  const active = params.get("tab") ?? "chats";
  const { user, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <aside className="border-r p-2 h-full flex flex-col items-center overflow-hidden">
      {/* Organization Logo */}
      <div className="h-10 w-10 rounded-md flex items-center justify-center mb-3 mt-2" aria-label="Organization">
        <img 
          src="https://cdn.jsdelivr.net/gh/FlexpointLLC/linquoassets@main/Logo.svg" 
          alt="Linquo Logo" 
          className="h-8 w-8 object-contain"
          onError={(e) => {
            // Fallback to text if CDN SVG fails to load
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.nextElementSibling as HTMLElement;
            if (fallback) fallback.style.display = 'flex';
          }}
        />
        <div 
          className="h-10 w-10 rounded-md bg-muted items-center justify-center hidden"
          style={{ display: 'none' }}
        >
          <span className="text-xs font-semibold text-muted-foreground">L</span>
        </div>
      </div>
      
      {/* Separator between logo and navigation */}
      <div className="w-8 h-px bg-border mb-3"></div>
      
      {/* Navigation Items */}
      <nav className="flex flex-col gap-3 w-full flex-1 min-h-0">
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
            <Icon className={cn(
              "h-5 w-5 transition-opacity",
              active === key ? "text-foreground opacity-100" : "text-muted-foreground opacity-70"
            )} />
          </Link>
        ))}
      </nav>

      {/* Avatar Menu at Bottom */}
      <div className="mt-auto flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center justify-center rounded-md p-2 hover:bg-muted transition-colors">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {user?.email?.slice(0, 2).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
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
      </div>
    </aside>
  );
}


