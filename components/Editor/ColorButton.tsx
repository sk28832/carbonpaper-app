// File: components/Editor/ColorButton.tsx
import React from "react";
import { Button } from "@/components/ui/button";

interface ColorButtonProps {
  color: string;
  onClick: (color: string) => void;
}

export const ColorButton: React.FC<ColorButtonProps> = ({ color, onClick }) => (
  <Button
    className="w-6 h-6 p-0 rounded-sm"
    style={{ backgroundColor: color }}
    onClick={() => onClick(color)}
  />
);