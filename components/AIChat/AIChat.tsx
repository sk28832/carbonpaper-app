// File: components/AIChat/AIChat.tsx

import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Save,
  MessageSquare,
  X,
  Quote,
  Paperclip,
  Terminal,
  Search,
  Edit,
  PenTool,
  BookOpen,
  FileText,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,TooltipContent,
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

interface AIChatProps {
  editorContent: string;
  messages: MessageType[];
  updateDocumentContent: (content: string) => void;
  addMessage: (message: MessageType) => void;
}

const AIChat: React.FC<AIChatProps> = ({
  editorContent,
  messages,
  updateDocumentContent,
  addMessage,
}) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSelectionButtonVisible, setIsSelectionButtonVisible] =
    useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [selectedSnippets, setSelectedSnippets] = useState<string[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [inputMode, setInputMode] = useState<InputMode>("question");
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([]);
  const [selectedSource, setSelectedSource] = useState<string>("General Web");
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection) {
        const fullText = selection.toString().trim();
        setSelectedText(fullText);
        setIsSelectionButtonVisible(fullText !== "");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  const handleAddSelectionToCommand = useCallback(() => {
    if (selectedText && !selectedSnippets.includes(selectedText)) {
      setSelectedSnippets((prev) => [...prev, selectedText]);
    }
    setIsSelectionButtonVisible(false);
  }, [selectedText, selectedSnippets]);

  const removeSelectedSnippet = useCallback((index: number) => {
    setSelectedSnippets((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSelectExample = useCallback((example: string) => {
    setInput(example);
  }, []);

  const handleFileUpload = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files) {
        const newFiles = Array.from(files).filter((file) => {
          const fileExtension = file.name.split(".").pop()?.toLowerCase();
          return fileExtension === "docx" || fileExtension === "pdf";
        });

        if (selectedDocuments.length + newFiles.length > 2) {
          setShowAlert(true);
          setTimeout(() => setShowAlert(false), 5000);
          return;
        }

        setSelectedDocuments((prevDocs) => [...prevDocs, ...newFiles]);
      }
    },
    [selectedDocuments]
  );

  const removeSelectedDocument = useCallback((index: number) => {
    setSelectedDocuments((prevDocs) => prevDocs.filter((_, i) => i !== index));
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (
      !input.trim() &&
      selectedDocuments.length === 0 &&
      selectedSnippets.length === 0
    )
      return;

    setIsSubmitting(true);
    setInput("");
    setSelectedSnippets([]);

    const snippetsText = selectedSnippets
      .map((snippet) => `"${snippet}"`)
      .join(" ");
    const fullInput = `${input} ${snippetsText}`.trim();

    const newUserMessage: MessageType = {
      id: uuidv4(),
      role: "user",
      content: fullInput,
      type: "text",
      attachments: selectedDocuments.map((file) => ({
        name: file.name,
        type: file.name.endsWith(".pdf") ? "pdf" : "docx",
      })),
    };

    addMessage(newUserMessage);
    setIsLoading(true);
    scrollToBottom();

    try {
      const formData = new FormData();
      formData.append("input", fullInput);
      formData.append("editorContent", editorContent);
      selectedDocuments.forEach((file) => {
        formData.append(`files`, file, file.name);
      });

      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      formData.append(
        "conversationHistory",
        JSON.stringify(conversationHistory)
      );
      formData.append("inputMode", inputMode);

      if (inputMode === "research") {
        formData.append("researchSource", selectedSource);
      }

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let newAssistantMessage: MessageType;

      switch (inputMode) {
        case "question":
          newAssistantMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.reply,
            type: "text",
          };
          break;
        case "edit":
          newAssistantMessage = {
            id: uuidv4(),
            role: "assistant",
            content: JSON.stringify(data.changes),
            type: "changes",
          };
          break;
        case "draft":
          newAssistantMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.draftContent,
            type: "draft",
          };
          break;
        case "research":
          newAssistantMessage = {
            id: uuidv4(),
            role: "assistant",
            content: data.researchResult,
            type: "research",
            citations: data.citations,
          };
          break;
        default:
          throw new Error("Invalid input mode");
      }

      addMessage(newAssistantMessage);

      if (inputMode === "edit" && data.changes) {
        updateDocumentContent(data.updatedContent);
      }
    } catch (error) {
      console.error("Error processing request:", error);
      const errorMessage: MessageType = {
        id: uuidv4(),
        role: "assistant",
        content: "Sorry, I couldn't process your request.",
        type: "text",
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
      setSelectedDocuments([]);
    }
  }, [
    input,
    selectedDocuments,
    selectedSnippets,
    messages,
    inputMode,
    editorContent,
    selectedSource,
    scrollToBottom,
    updateDocumentContent,
    addMessage,
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

  const handleSourceSelect = useCallback((source: string) => {
    setSelectedSource(source);
  }, []);

  const handleSubmit = useCallback(() => {
    if (
      !input.trim() &&
      selectedDocuments.length === 0 &&
      selectedSnippets.length === 0
    )
      return;
    debouncedHandleSendMessage();
  }, [input, selectedDocuments, selectedSnippets, debouncedHandleSendMessage]);

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
                  <Message
                    message={message}
                    handleAcceptChange={() => {}}
                    handleRejectChange={() => {}}
                    handleCardClick={() => {}}
                    insertDraftContent={() => {}}
                    handleAcceptDraft={() => {}}
                    handleRejectDraft={() => {}}
                  />
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
              <AlertTitle>Upload limit</AlertTitle>
              <AlertDescription>
                You can only upload a maximum of 2 files.
              </AlertDescription>
            </Alert>
          )}
  
          {selectedDocuments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedDocuments.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-200 rounded p-1"
                >
                  {file.name.endsWith(".pdf") ? (
                    <FileText size={16} />
                  ) : (
                    <File size={16} />
                  )}
                  <span className="ml-1 text-xs truncate max-w-[100px]">
                    {file.name}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0"
                    onClick={() => removeSelectedDocument(index)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          )}
  
          {selectedSnippets.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSnippets.map((snippet, index) => (
                <div
                  key={index}
                  className="flex items-center bg-gray-200 rounded p-1"
                >
                  <Quote size={16} />
                  <span className="ml-1 text-xs truncate max-w-[100px]">
                    {snippet}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 p-0"
                    onClick={() => removeSelectedSnippet(index)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
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
                  {/* <Tooltip>
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
                      <p>Edit document</p>
                    </TooltipContent>
                  </Tooltip> */}
                  {/* <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="draft"
                        aria-label="Toggle draft mode"
                        className={
                          inputMode === "draft"
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }
                      >
                        <PenTool className="h-4 w-4" />
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Draft new clauses</p>
                    </TooltipContent>
                  </Tooltip> */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <ToggleGroupItem
                        value="research"
                        aria-label="Toggle research mode"
                        className={`relative ${
                          inputMode === "research"
                            ? "bg-accent text-accent-foreground"
                            : ""
                        }`}
                      >
                        <BookOpen className="h-4 w-4" />
                        <span className="absolute -top-2 -right-2 bg-gray-300 text-xs font-bold px-1 rounded-full">
                          Beta
                        </span>
                      </ToggleGroupItem>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Research legal topics (Beta)</p>
                    </TooltipContent>
                  </Tooltip>
                </ToggleGroup>
              </TooltipProvider>
              <AnimatePresence>
                {isSelectionButtonVisible && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleAddSelectionToCommand}
                          size="sm"
                          className="rounded-full p-2"
                        >
                          <Quote size={16} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Add selection to command</p>
                      </TooltipContent>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
  
            <AnimatePresence>
              {inputMode === "research" && (
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
                    Selected source: {selectedSource}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
  
            <div className="relative">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  inputMode === "question"
                    ? "Ask a question to learn more about your document..."
                    : inputMode === "edit"
                    ? "Enter a command to edit your document..."
                    : inputMode === "draft"
                    ? "Describe the clause you want to draft..."
                    : "Enter a legal topic or question to research..."
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
            <Input
              type="file"
              accept=".docx,.pdf"
              onChange={handleFileUpload}
              ref={fileInputRef}
              style={{ display: "none" }}
              multiple
            />
            {/* <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    variant="outline"
                    className="flex items-center justify-center"
                    disabled={selectedDocuments.length >= 2}
                  >
                    <Paperclip size={16} className="mr-2" />
                    Attach Files
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Attach files to your message</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider> */}
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
          currentSource={selectedSource}
        />
      </motion.div>
    </TooltipProvider>
  );
};

export default AIChat;