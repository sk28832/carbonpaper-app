import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Wand2, Check, X, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
import { TrackedChanges } from '@/types/fileTypes';

interface HoveringFormatBarProps {
  onQuickAction: (action: string) => Promise<void>;
  onCustomAction: (action: string, isEdit: boolean) => Promise<void>;
  position: { top: number; left: number } | null;
  trackedChanges: TrackedChanges | null;
  onAcceptChanges: () => void;
  onRejectChanges: () => void;
  onNavigateVersion: (direction: 'prev' | 'next') => void;
  onReprocessChanges: () => void;
}

const HoveringFormatBar: React.FC<HoveringFormatBarProps> = ({
  onQuickAction,
  onCustomAction,
  position,
  trackedChanges,
  onAcceptChanges,
  onRejectChanges,
  onNavigateVersion,
  onReprocessChanges,
}) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [customAction, setCustomAction] = useState('');

  if (!position) return null;

  const handleCustomAction = async () => {
    if (customAction.trim()) {
      await onCustomAction(customAction, isEditMode);
      setCustomAction('');
    }
  };

  const handleQuickAction = async (action: string) => {
    await onQuickAction(action);
  };

  return (
    <div
      className="absolute bg-white border border-gray-200 rounded-md shadow-lg p-2 z-50 flex items-center space-x-2"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
      }}
    >
      {trackedChanges ? (
        <>
          <Button variant="ghost" size="sm" onClick={() => onNavigateVersion('prev')} disabled={trackedChanges.currentVersionIndex === 0}>
            <ArrowLeft size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onNavigateVersion('next')} disabled={trackedChanges.currentVersionIndex === trackedChanges.versions.length - 1}>
            <ArrowRight size={16} />
          </Button>
          <Button variant="default" size="sm" onClick={onAcceptChanges}>
            <Check size={16} />
          </Button>
          <Button variant="outline" size="sm" onClick={onRejectChanges}>
            <X size={16} />
          </Button>
          <Button variant="ghost" size="sm" onClick={onReprocessChanges}>
            <RotateCcw size={16} />
          </Button>
        </>
      ) : (
        <>
          <Wand2 size={16} className="text-gray-500" />
          <div className="flex items-center space-x-2">
            <Switch
              id="edit-mode"
              checked={isEditMode}
              onCheckedChange={setIsEditMode}
            />
            <Label htmlFor="edit-mode" className="text-sm">
              {isEditMode ? 'Edit' : 'Ask'}
            </Label>
          </div>
          {isEditMode && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('improve')}>
                Improve
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('fixGrammar')}>
                Fix
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('shorter')}>
                Shorter
              </Button>
              <Button variant="ghost" size="sm" onClick={() => handleQuickAction('longer')}>
                Longer
              </Button>
            </>
          )}
          <Input
            type="text"
            placeholder={isEditMode ? "Custom edit..." : "Ask a question..."}
            value={customAction}
            onChange={(e) => setCustomAction(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCustomAction()}
            className="w-40"
          />
          <Button variant="default" size="sm" onClick={handleCustomAction}>
            Send
          </Button>
        </>
      )}
    </div>
  );
};

export default HoveringFormatBar;