"use client";
import { useSearchParams } from "next/navigation";

interface DynamicMainProps {
  children: React.ReactNode;
}

export function DynamicMain({ children }: DynamicMainProps) {
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") ?? "chats";
  
  // Remove overflow-y-auto only for chats tab
  const mainClassName = currentTab === "chats" 
    ? "p-6 flex-1" 
    : "p-6 flex-1 overflow-y-auto";

  return (
    <main className={mainClassName}>
      {children}
    </main>
  );
}
