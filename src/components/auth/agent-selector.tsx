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
import { useAuth } from "@/hooks/useAuth";
import { useAgents } from "@/hooks/useAgents";
import { LogOut, Building2 } from "lucide-react";

export function AgentSelector() {
  const { agent, organization, signOut } = useAuth();
  const { data: agents } = useAgents();
  const [isOpen, setIsOpen] = useState(false);

  if (!agent || !organization) {
    return null;
  }

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 h-8 px-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-xs">
              {agent.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">{agent.name}</span>
            <span className="text-xs text-muted-foreground">{agent.role}</span>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="px-2 py-1.5">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{organization.name}</p>
              <p className="text-xs text-muted-foreground">linquo.com/{organization.slug}</p>
            </div>
          </div>
        </div>
        <DropdownMenuSeparator />
        <div className="px-2 py-1.5">
          <p className="text-sm font-medium">{agent.name}</p>
          <p className="text-xs text-muted-foreground">{agent.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{agent.role}</p>
        </div>
        <DropdownMenuSeparator />
        {agents && agents.length > 1 && (
          <>
            <div className="px-2 py-1">
              <p className="text-xs font-medium text-muted-foreground">Other Agents</p>
            </div>
            {agents.filter(a => a.id !== agent.id).map((otherAgent) => (
              <DropdownMenuItem
                key={otherAgent.id}
                className="flex items-center gap-2"
                disabled
              >
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-xs">
                    {otherAgent.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm">{otherAgent.name}</span>
                  <span className="text-xs text-muted-foreground">{otherAgent.role}</span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
