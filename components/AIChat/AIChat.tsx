import React, { useState, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal, Search, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CommandPalette, CommandPaletteTrigger } from "./CommandPalette";
import Sources from "./Sources";
import Message from "./Message";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";
import { Message as MessageType, InputMode } from "@/types/chatTypes";
import { FileItem, TrackedChanges } from "@/types/fileTypes";

interface AIChatProps {
  currentFile: FileItem;
  editorContent: string;
  messages: MessageType[];
  updateDocumentContent: (content: string) => void;
  addMessage: (message: MessageType) => void;
  trackedChanges: TrackedChanges | null;
  onTrackedChangesUpdate: (trackedChanges: TrackedChanges | null) => void;
}

const AIChat: React.FC<AIChatProps> = ({
  currentFile,
  editorContent,
  messages,
  updateDocumentContent,
  addMessage,
  trackedChanges,
  onTrackedChangesUpdate,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("question");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSelectExample = useCallback((example: string) => {
    setInput(example);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim()) return;

    setIsSubmitting(true);
    setInput("");

    const newUserMessage: MessageType = {
      id: uuidv4(),
      role: "user",
      content: input.trim(),
      type: "text",
    };

    await addMessage(newUserMessage);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("input", input.trim());
      formData.append("editorContent", editorContent);
      formData.append("inputMode", inputMode);
      formData.append("selectedSources", JSON.stringify(selectedSources));

      if (inputMode === "edit" && trackedChanges) {
        formData.append("trackedChanges", JSON.stringify(trackedChanges));
      }

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      const newAssistantMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: inputMode === "edit" ? "Suggested edit" : data.reply,
        type: inputMode === "edit" ? "edit" : "text",
        ...(inputMode === "edit" && { trackedChanges: data.trackedChanges }),
        ...((inputMode === "question" && data.citations) && { citations: data.citations }),
      };

      await addMessage(newAssistantMessage);

      if (inputMode === "edit" && data.trackedChanges) {
        onTrackedChangesUpdate(data.trackedChanges);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I couldn't process your request.",
        type: "text",
      };
      await addMessage(errorMessage);
      setShowAlert(true);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }, [
    input,
    inputMode,
    editorContent,
    selectedSources,
    trackedChanges,
    addMessage,
    onTrackedChangesUpdate,
  ]);

  const debouncedHandleSendMessage = useMemo(
    () => debounce(handleSendMessage, 300),
    [handleSendMessage]
  );

  const handleInputModeChange = useCallback((value: string) => {
    if (value) {
      setInputMode(value as InputMode);
    }
  }, []);

  const handleSourceSelect = useCallback((sources: string[]) => {
    setSelectedSources(sources);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!input.trim()) return;
    debouncedHandleSendMessage();
  }, [input, debouncedHandleSendMessage]);

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-full flex flex-col p-4"
      >
        <motion.div
          className="flex-grow overflow-y-auto mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ScrollArea className="h-full" ref={scrollAreaRef}>
            <AnimatePresence>
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`mb-2 ${
                    message.role === "user" ? "text-right" : "text-left"
                  }`}
                >
                  <Message message={message} />
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center my-4"
              >
                <div className="flex items-center justify-center space-x-2">
                  <motion.div
                    className="w-4 h-4 bg-black rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                  <span>AI is thinking</span>
                </div>
              </motion.div>
            )}
          </ScrollArea>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="space-y-4"
        >
          {showAlert && (
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                An error occurred while processing your request.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 relative">
            <div className="flex justify-between items-center">
              <TooltipProvider>
                <ToggleGroup
                  type="single"
                  value={inputMode}
                  onValueChange={handleInputModeChange}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="question"
                        aria-label="Toggle question mode"
                        className={
                          inputMode === "question"
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                      >
                        <Search className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Ask a question</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="edit"
                        aria-label="Toggle edit mode"
                        className={
                          inputMode === "edit"
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Edit document or draft new content</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>
            </div>

            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: "easeInOut",
                }}
                style={{ overflow: "hidden" }}
              >
                <span
                  className="inline-block text-sm font-medium cursor-pointer px-2 py-1 bg-gray-100 rounded"
                  onClick={() => setIsSourcesOpen(true)}
                >
                  Selected sources: {selectedSources.join(", ") || "None"}
                </span>
              </motion.div>
            </AnimatePresence>

            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputMode === "question"
                    ? "Ask a question about your document or related legal topics..."
                    : "Enter a command to edit your document or draft new content..."
                }
                className="w-full pr-10"
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <CommandPaletteTrigger setIsOpen={setIsCommandPaletteOpen} />
            </div>
          </div>

          <div className="flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || isLoading}
                    className="flex-grow"
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : isLoading
                      ? "Processing..."
                      : "Submit"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Submit message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>

        <CommandPalette
          mode={inputMode}
          onSelectExample={handleSelectExample}
          isOpen={isCommandPaletteOpen}
          setIsOpen={setIsCommandPaletteOpen}
        />

        <Sources
          isOpen={isSourcesOpen}
          setIsOpen={setIsSourcesOpen}
          onSourceSelect={handleSourceSelect}
          currentSources={selectedSources}
        />
      </motion.div>
    </TooltipProvider>
  );
};

export default AIChat;