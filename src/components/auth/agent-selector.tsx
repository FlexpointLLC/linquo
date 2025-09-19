"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from "@/components/ui/dropdown-menu";
import { useCurrentAgent } from "@/hooks/useCurrentAgent";
import { useAgents } from "@/hooks/useAgents";
import { LogOut } from "lucide-react";

export function AgentSelector() {
  const { currentAgent, setAgent, logoutAgent } = useCurrentAgent();
  const { data: agents } = useAgents();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentAgent) {
    return null;
  }

  const handleAgentSelect = (agent: any) => {
    setAgent(agent);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logoutAgent();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {currentAgent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{currentAgent.name}</span>
            <span className="text-xs text-muted-foreground">{currentAgent.role}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{currentAgent.name}</p>
          <p className="text-xs text-muted-foreground">{currentAgent.email}</p>
        </div>
        <DropdownMenuSeparator />
        {agents?.map((agent) => (
          <DropdownMenuItem
            key={agent.id}
            onClick={() => handleAgentSelect(agent)}
            className="flex items-center gap-2"
          >
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-xs">
                {agent.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm">{agent.name}</span>
              <span className="text-xs text-muted-foreground">{agent.role}</span>
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
