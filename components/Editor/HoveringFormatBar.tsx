import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Check, X, RotateCcw, ArrowLeft, ArrowRight } from 'lucide-react';
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
      className="absolute bg-white border border-gray-200 rounded-md shadow-lg p-3 z-50 flex items-center space-x-3"
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
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <div className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${!isEditMode ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
              Ask
            </div>
            <Switch
              checked={isEditMode}
              onCheckedChange={setIsEditMode}
              className="mx-2"
            />
            <div className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${isEditMode ? 'bg-white shadow-sm text-black' : 'text-gray-500'}`}>
              Edit
            </div>
          </div>
          
          {isEditMode && (
            <div className="flex items-center space-x-2">
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
            </div>
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