"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function RefreshButton() {
  return (
    <Button 
      size="sm" 
      variant="secondary"
      onClick={() => window.location.reload()}
    >
      <RefreshCw className="h-4 w-4 mr-1" /> Refresh
    </Button>
  );
}
