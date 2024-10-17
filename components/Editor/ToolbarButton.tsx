// File: components/Editor/ToolbarButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
}

export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ onClick, icon, tooltip, active = false }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          onClick={onClick} 
          variant={active ? "default" : "ghost"} 
          size="icon" 
          className="h-8 w-8"
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);
