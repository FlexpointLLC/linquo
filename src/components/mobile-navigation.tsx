"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageCircle, Users, Settings2, UserCheck, Code2 } from "lucide-react";

const items = [
  { key: "chats", label: "Chats", icon: MessageCircle },
  { key: "agents", label: "Agents", icon: UserCheck },
  { key: "customers", label: "Customers", icon: Users },
  { key: "embed", label: "Embed", icon: Code2 },
  { key: "settings", label: "Settings", icon: Settings2 },
];

export function MobileNavigation() {
  const params = useSearchParams();
  const active = params.get("tab") ?? "chats";
  const conversationId = params.get("cid");

  // Hide navigation when viewing individual conversation in chat tab on mobile
  if (active === "chats" && conversationId) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t md:hidden z-40">
      <nav className="flex justify-around items-center h-16">
        {items.map(({ key, label, icon: Icon }) => (
          <Link
            key={key}
            href={`/dashboard?tab=${key}`}
            className={cn(
              "flex flex-col items-center justify-center p-1 text-xs transition-colors",
              active === key ? "text-foreground" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={label}
            title={label}
          >
            <Icon className={cn(
              "h-5 w-5 mb-1 transition-opacity",
              active === key ? "opacity-100" : "opacity-70"
            )} />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}