import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  X, 
  RotateCcw, 
  ArrowLeft, 
  ArrowRight, 
  Wand2, 
  MessageSquare, 
  Loader2 
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
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

const TOOLBAR_MARGIN = 8;
const MIN_VIEWPORT_MARGIN = 16;

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
  const toolbarRef = useRef<HTMLDivElement>(null);
  const initialPositionRef = useRef<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!position || !toolbarRef.current) return;
    if (initialPositionRef.current) return; // Don't update if we already have a position

    const toolbar = toolbarRef.current;
    const toolbarRect = toolbar.getBoundingClientRect();
    
    const iframeElement = document.querySelector('iframe');
    if (!iframeElement) return;

    const iframeRect = iframeElement.getBoundingClientRect();
    const editorContent = iframeElement.contentDocument?.getElementById('editor-content');
    if (!editorContent) return;
    
    const editorRect = editorContent.getBoundingClientRect();
    
    // Calculate relative position inside iframe
    const relativeTop = position.top - iframeRect.top;
    const relativeLeft = position.left - iframeRect.left;
    
    // Calculate space in iframe
    const spaceBelow = editorRect.height - relativeTop;
    const toolbarHeight = toolbarRect.height;
    
    // Determine position
    const shouldShowAbove = spaceBelow < (toolbarHeight + TOOLBAR_MARGIN * 2);

    // Calculate final position relative to editor content
    let top = shouldShowAbove
      ? relativeTop - toolbarHeight - TOOLBAR_MARGIN
      : relativeTop + TOOLBAR_MARGIN;

    let left = relativeLeft;
    
    // Store the initial position
    initialPositionRef.current = { top, left };
    toolbar.style.transform = 'translateX(-50%)';
    toolbar.style.top = `${top}px`;
    toolbar.style.left = `${left}px`;
  }, [position]);

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

  if (!position) return null;

  return (
    <TooltipProvider>
      <motion.div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          zIndex: 9999,
        }}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.1, ease: 'easeOut' }}
        className="bg-white border border-gray-200 rounded-lg shadow-lg p-2 backdrop-blur-sm bg-opacity-95"
      >
        <LayoutGroup>
          <motion.div layout="preserve-aspect" className="flex flex-col gap-2">
            {trackedChanges ? (
              <motion.div 
                layout 
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.1 }}
                className="flex items-center gap-1 p-1"
              >
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
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="flex flex-col gap-2"
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <motion.div layout="position" className="flex items-center justify-between gap-3 px-2 py-1">
                  <motion.div layout className="flex items-center gap-3">
                    <motion.div 
                      layout
                      animate={{
                        backgroundColor: !isEditMode ? 'rgb(239 246 255)' : 'rgb(243 244 246)',
                        color: !isEditMode ? 'rgb(29 78 216)' : 'rgb(156 163 175)',
                      }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-md"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-sm font-medium">Ask</span>
                    </motion.div>

                    <motion.div layout className="relative">
                      <Switch
                        checked={isEditMode}
                        onCheckedChange={setIsEditMode}
                        className="data-[state=checked]:bg-purple-500"
                      />
                    </motion.div>

                    <motion.div 
                      layout
                      animate={{
                        backgroundColor: isEditMode ? 'rgb(245 243 255)' : 'rgb(243 244 246)',
                        color: isEditMode ? 'rgb(109 40 217)' : 'rgb(156 163 175)',
                      }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 px-3 py-1 rounded-md"
                    >
                      <Wand2 className="h-4 w-4" />
                      <span className="text-sm font-medium">Edit</span>
                    </motion.div>
                  </motion.div>
                </motion.div>

                <AnimatePresence mode="wait" initial={false}>
                  {isEditMode && (
                    <motion.div
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ 
                        duration: 0.15,
                        ease: 'easeOut',
                        opacity: { duration: 0.1 }
                      }}
                      className="flex flex-wrap gap-1 px-1 border-t border-b border-gray-100 py-2"
                    >
                      {quickActions.map(({ id, label, icon: Icon }) => (
                        <Tooltip key={id}>
                          <TooltipTrigger asChild>
                            <motion.button
                              layout
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              transition={{ duration: 0.1 }}
                            >
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
                            </motion.button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div layout="position" className="flex items-center gap-1 px-1">
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
                      <motion.div 
                        whileHover={{ scale: 1.01 }} 
                        whileTap={{ scale: 0.99 }}
                        transition={{ duration: 0.1 }}
                      >
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
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent>{isEditMode ? 'Apply Edit' : 'Ask Question'}</TooltipContent>
                  </Tooltip>
                </motion.div>

                <AnimatePresence>
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 0.5 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="absolute inset-0 bg-white backdrop-blur-[1px] flex items-center justify-center rounded-lg"
                    >
                      <Badge variant="secondary" className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                        {isEditMode ? 'Applying changes...' : 'Getting answer...'}
                      </Badge>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </LayoutGroup>
      </motion.div>
    </TooltipProvider>
  );
};

export default HoveringFormatBar;