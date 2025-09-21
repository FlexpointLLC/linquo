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
          className: "bg-green-100 text-green-800 border-green-200",
          icon: <Wifi className="h-3 w-3 mr-1" />,
          text: "Connected",
        };
      case "disconnected":
        return {
          variant: "destructive" as const,
          className: "bg-orange-100 text-orange-800 border-orange-200",
          icon: <WifiOff className="h-3 w-3 mr-1" />,
          text: "Refresh",
        };
    }
  };

  const badgeProps = getBadgeProps();

  return (
    <Badge
      variant={badgeProps.variant}
      className={`${badgeProps.className} cursor-pointer hover:opacity-80 transition-opacity`}
      onClick={status === "disconnected" ? refresh : undefined}
    >
      {badgeProps.icon}
      {badgeProps.text}
    </Badge>
  );
}
