// File: components/Editor/ToolbarButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

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
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-8 w-8",
            active && "bg-gray-200 hover:bg-gray-300"
          )}
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