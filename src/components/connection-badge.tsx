"use client";
import { Badge } from "@/components/ui/badge";
import { useConnectionStatus } from "@/hooks/useConnectionStatus";
import { Wifi, WifiOff } from "lucide-react";

export function ConnectionBadge() {
  const { status, refresh } = useConnectionStatus();

  const getBadgeProps = () => {
    switch (status) {
      case "connected":
        return {
          variant: "default" as const,
          className: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/20",
          icon: <Wifi className="h-3 w-3 mr-1" />,
          text: "Connected",
        };
      case "disconnected":
        return {
          variant: "destructive" as const,
          className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/10",
          icon: <WifiOff className="h-3 w-3 mr-1" />,
          text: "Reconnecting...",
        };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Badge
      variant={badgeProps.variant}
      className={`${badgeProps.className} ${status === "disconnected" ? "cursor-pointer hover:opacity-80" : ""} transition-opacity`}
      onClick={status === "disconnected" ? refresh : undefined}
      title={status === "disconnected" ? "Click to manually refresh" : undefined}
    >
      {badgeProps.icon}
      {badgeProps.text}
    </Badge>
  );
}
