"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Users2, Settings, UserCog } from "lucide-react";

const items = [
  { key: "chats", label: "Chats", icon: MessageSquare },
  { key: "agents", label: "Agents", icon: UserCog },
  { key: "customers", label: "Customers", icon: Users2 },
  { key: "settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const params = useSearchParams();
  const active = params.get("tab") ?? "chats";
  return (
    <aside className="border-r p-2 h-full flex flex-col items-center">
      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center mb-3" aria-label="App">
        <span className="text-xs font-semibold">IC</span>
      </div>
      <nav className="flex flex-col gap-2 w-full">
        {items.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={{ pathname: "/dashboard", query: { tab: key } }}
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
    </aside>
  );
}


