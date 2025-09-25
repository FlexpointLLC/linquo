"use client";
import { useSearchParams } from "next/navigation";

interface DynamicMainProps {
  children: React.ReactNode;
}

export function DynamicMain({ children }: DynamicMainProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "chats";
  
  // Remove overflow-y-auto for chats tab, remove padding for agents, customers, embed, and settings tabs on mobile only
  // Add bottom margin on mobile for navbar clearance
  const mainClassName = currentTab === "chats" 
    ? "p-6 mb-20 md:mb-0 flex-1" 
    : currentTab === "agents" || currentTab === "customers" || currentTab === "embed" || currentTab === "settings"
    ? "p-0 mb-20 md:p-6 md:mb-0 flex-1 overflow-y-auto"
    : "p-6 mb-20 md:mb-0 flex-1 overflow-y-auto";

  return (
    <main className={mainClassName}>
      {children}
    </main>
  );
}
