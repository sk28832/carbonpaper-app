import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

interface HoveringFormatBarProps {
  onAiAction: (action: string, value?: string) => void;
  position: { top: number; left: number } | null;
}

const HoveringFormatBar: React.FC<HoveringFormatBarProps> = ({ onAiAction, position }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customAction, setCustomAction] = useState('');

  if (!position) return null;

  const handleCustomAction = () => {
    if (customAction.trim()) {
      onAiAction(customAction);
      setCustomAction('');
      setIsOpen(false);
    }
  };

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-md shadow-lg p-2 flex items-center space-x-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center">
            <Wand2 size={16} className="mr-2" />
            AI Actions
            <ChevronDown size={16} className="ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onAiAction('improve')}>
            Improve
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAiAction('fixGrammar')}>
            Fix Grammar
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAiAction('shorter')}>
            Make Shorter
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onAiAction('longer')}>
            Make Longer
          </DropdownMenuItem>
          <div className="p-2">
            <Input
              type="text"
              placeholder="Custom action..."
              value={customAction}
              onChange={(e) => setCustomAction(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomAction()}
            />
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default HoveringFormatBar;