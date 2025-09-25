"use client";
import { useSearchParams } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard-header";
import { Separator } from "@/components/ui/separator";

export function ConditionalDashboardHeader() {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "chats";
  const conversationId = params.get("cid");

  // Hide header on mobile when viewing individual conversation in chat tab
  const shouldHideOnMobile = activeTab === "chats" && conversationId;

  return (
    <div className={shouldHideOnMobile ? "hidden md:block" : "block"}>
      <DashboardHeader />
    </div>
  );
}

export function ConditionalSeparator() {
  const params = useSearchParams();
  const activeTab = params.get("tab") ?? "chats";
  const conversationId = params.get("cid");

  // Hide separator on mobile when viewing individual conversation in chat tab
  const shouldHideOnMobile = activeTab === "chats" && conversationId;

  return (
    <div className={shouldHideOnMobile ? "hidden md:block" : "block"}>
      <Separator />
    </div>
  );
}
