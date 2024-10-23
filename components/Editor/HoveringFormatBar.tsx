import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Check, X, RotateCcw, ArrowLeft, ArrowRight, Wand2, MessageSquare, Loader2 } from 'lucide-react';
import { TrackedChanges } from '@/types/fileTypes';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';

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

const TOOLBAR_MARGIN = 8; // Margin between toolbar and text
const MIN_VIEWPORT_MARGIN = 16; // Minimum margin from viewport edges

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
  const [isLoading, setIsLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [toolbarPosition, setToolbarPosition] = useState<{ top: number; left: number; transform: string }>({ top: 0, left: 0, transform: '' });
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!position || !toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarRect = toolbar.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // Check if there's room above the selection
    const spaceAbove = position.top;
    const spaceBelow = viewportHeight - position.top;
    const shouldShowAbove = spaceAbove > toolbarRect.height + TOOLBAR_MARGIN;

    // Calculate vertical position
    let top = shouldShowAbove
      ? position.top - toolbarRect.height - TOOLBAR_MARGIN
      : position.top + TOOLBAR_MARGIN;

    // Ensure the toolbar doesn't go outside the viewport vertically
    top = Math.max(MIN_VIEWPORT_MARGIN, Math.min(top, viewportHeight - toolbarRect.height - MIN_VIEWPORT_MARGIN));

    // Calculate horizontal position
    let left = position.left;
    const halfWidth = toolbarRect.width / 2;
    
    // Ensure the toolbar doesn't go outside the viewport horizontally
    left = Math.max(halfWidth + MIN_VIEWPORT_MARGIN, Math.min(left, viewportWidth - halfWidth - MIN_VIEWPORT_MARGIN));

    // Update position
    setToolbarPosition({
      top,
      left,
      transform: 'translateX(-50%)',
    });
  }, [position, isEditMode]);

  if (!position) return null;

  const handleCustomAction = async () => {
    if (customAction.trim()) {
      setIsLoading(true);
      try {
        await onCustomAction(customAction, isEditMode);
      } finally {
        setIsLoading(false);
        setCustomAction('');
      }
    }
  };

  const handleQuickAction = async (action: string) => {
    setActiveAction(action);
    setIsLoading(true);
    try {
      await onQuickAction(action);
    } finally {
      setIsLoading(false);
      setActiveAction(null);
    }
  };

  const quickActions = [
    { id: 'improve', label: 'Improve', icon: Wand2 },
    { id: 'fixGrammar', label: 'Fix Grammar', icon: Check },
    { id: 'shorter', label: 'Make Shorter', icon: ArrowLeft },
    { id: 'longer', label: 'Expand', icon: ArrowRight },
  ];

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        style={{
          position: 'fixed',
          top: toolbarPosition.top,
          left: toolbarPosition.left,
          transform: toolbarPosition.transform,
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 backdrop-blur-sm bg-opacity-95"
      >
        <div className="flex flex-col gap-2">
          {trackedChanges ? (
            <div className="flex items-center gap-1 p-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onNavigateVersion('prev')} 
                    disabled={trackedChanges.currentVersionIndex === 0}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Previous version</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onNavigateVersion('next')} 
                    disabled={trackedChanges.currentVersionIndex === trackedChanges.versions.length - 1}
                    className="h-8 w-8 p-0"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Next version</TooltipContent>
              </Tooltip>

              <div className="h-4 w-px bg-gray-200 mx-1" />

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={onAcceptChanges}
                    className="h-8 w-8 p-0 bg-green-500 hover:bg-green-600"
                  >
                    <Check className="h-4 w-4 text-white" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Accept changes</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRejectChanges}
                    className="h-8 w-8 p-0 border-red-200 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 text-red-500" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reject changes</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onReprocessChanges}
                    className="h-8 w-8 p-0"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate suggestions</TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-3 px-2 py-1">
                <div className="flex items-center gap-3">
                  <div 
                    className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
                      !isEditMode ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Ask</span>
                  </div>

                  <Switch
                    checked={isEditMode}
                    onCheckedChange={setIsEditMode}
                    className="data-[state=checked]:bg-purple-500"
                  />

                  <div 
                    className={`flex items-center gap-2 px-3 py-1 rounded-md transition-colors ${
                      isEditMode ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    <Wand2 className="h-4 w-4" />
                    <span className="text-sm font-medium">Edit</span>
                  </div>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {isEditMode && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex flex-wrap gap-1 px-1 border-t border-b border-gray-100 py-2 overflow-hidden"
                  >
                    {quickActions.map(({ id, label, icon: Icon }) => (
                      <Tooltip key={id}>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleQuickAction(id)}
                            disabled={isLoading}
                            className={`h-8 px-3 text-xs ${
                              activeAction === id ? 'bg-purple-50 text-purple-600' : ''
                            }`}
                          >
                            {activeAction === id && isLoading ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Icon className="h-3 w-3 mr-1" />
                            )}
                            {label}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">{label}</TooltipContent>
                      </Tooltip>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex items-center gap-1 px-1">
                <Input
                  type="text"
                  placeholder={isEditMode ? "Enter edit instruction..." : "Ask a question about the selection..."}
                  value={customAction}
                  onChange={(e) => setCustomAction(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomAction()}
                  className="h-8 text-sm min-w-[250px]"
                  disabled={isLoading}
                />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant={isEditMode ? "default" : "secondary"}
                      size="sm" 
                      onClick={handleCustomAction}
                      disabled={isLoading || !customAction.trim()}
                      className="h-8 px-3"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isEditMode ? (
                        <Wand2 className="h-4 w-4" />
                      ) : (
                        <MessageSquare className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{isEditMode ? 'Apply Edit' : 'Ask Question'}</TooltipContent>
                </Tooltip>
              </div>

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg"
                >
                  <Badge variant="secondary" className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {isEditMode ? 'Applying changes...' : 'Getting answer...'}
                  </Badge>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </TooltipProvider>
  );
};

export default HoveringFormatBar;
