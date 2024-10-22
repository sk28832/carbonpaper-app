// File: components/Layout/CarbonPaper.tsx
"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Resizable } from "re-resizable";
import Editor from "../Editor/Editor";
import AIChat from "../AIChat/AIChat";
import { ArrowLeft, Save, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileItem, TrackedChanges } from "@/types/fileTypes";
import useDelayedState from "@/hooks/useDelayedState";
import { Message } from "@/types/chatTypes";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { addChatMessage, updateFile, updateTrackedChanges } from "@/lib/mockDb";
import { v4 as uuidv4 } from "uuid";

interface CarbonPaperProps {
  fileId: string;
}

const CarbonPaper: React.FC<CarbonPaperProps> = ({ fileId }) => {
  const router = useRouter();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [aiChatWidth, setAiChatWidth] = useState(400);
  const [isLoading, setIsLoading] = useDelayedState(true, 1000);
  const [editorContent, setEditorContent] = useState("");
  const [editorTextContent, setEditorTextContent] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [navigationPath, setNavigationPath] = useState("");
  const [trackedChanges, setTrackedChanges] = useState<TrackedChanges | null>(
    null
  );
  const isSavingRef = useRef(false);
  const lastSavedContentRef = useRef("");
  const lastContentRef = useRef("");
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const fetchFile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${fileId}`);
        if (response.ok) {
          const file = await response.json();
          setCurrentFile(file);
          setEditorContent(file.content);
          setEditorTextContent(extractTextFromHtml(file.content));
          setMessages(file.messages || []);
          setTrackedChanges(file.trackedChanges || null);
          lastSavedContentRef.current = file.content;
          lastContentRef.current = file.content;
        } else {
          console.error("Failed to fetch file");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching file:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
        isInitialLoad.current = false;
      }
    };

    fetchFile();
  }, [fileId, router, setIsLoading]);

  const extractTextFromHtml = (html: string): string => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (!currentFile || isInitialLoad.current) return;

      if (newContent !== lastContentRef.current) {
        lastContentRef.current = newContent;
        setCurrentFile((prevFile) => ({
          ...prevFile!,
          content: newContent,
          isSaved: lastSavedContentRef.current === newContent,
        }));
        setEditorContent(newContent);
        setEditorTextContent(extractTextFromHtml(newContent));
      }
    },
    [currentFile]
  );

  const handleTrackedChangesUpdate = useCallback(
    async (newTrackedChanges: TrackedChanges | null) => {
      setTrackedChanges(newTrackedChanges);
      if (currentFile) {
        try {
          await updateTrackedChanges(currentFile.id, newTrackedChanges);
          setCurrentFile((prevFile) => ({
            ...prevFile!,
            trackedChanges: newTrackedChanges,
            isSaved: false,
          }));
        } catch (error) {
          console.error("Error updating tracked changes:", error);
        }
      }
    },
    [currentFile]
  );

  const handleAddMessage = useCallback(
    async (newMessage: Message) => {
      if (currentFile) {
        try {
          await addChatMessage(currentFile.id, newMessage);
          setMessages((prevMessages) => [...prevMessages, newMessage]);
          setCurrentFile((prevFile) => ({
            ...prevFile!,
            messages: [...prevFile!.messages, newMessage],
            isSaved: false,
          }));
        } catch (error) {
          console.error("Error adding chat message:", error);
        }
      }
    },
    [currentFile]
  );

  const handleQuickAction = useCallback(
    async (selectedText: string, action: string): Promise<void> => {
      if (!currentFile) return;

      setIsAIChatOpen(true);

      try {
        const formData = new FormData();
        formData.append("input", action);
        formData.append("editorContent", editorContent);
        formData.append("selectedText", selectedText);
        formData.append("inputMode", "edit");
        formData.append("selectedSources", JSON.stringify([]));

        const loadingMessage: Message = {
          id: uuidv4(),
          role: "user",
          content: `Applying quick action: ${action} to "${selectedText}"`,
          type: "text",
        };
        await handleAddMessage(loadingMessage);

        const response = await fetch("/api/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: "Changes applied",
          type: "edit",
          trackedChanges: data.trackedChanges,
        };
        await handleAddMessage(assistantMessage);

        if (data.trackedChanges) {
          await handleTrackedChangesUpdate(data.trackedChanges);
        }
      } catch (error) {
        console.error("Error processing quick action:", error);
      }
    },
    [currentFile, editorContent, handleTrackedChangesUpdate, handleAddMessage]
  );

  const handleCustomAction = useCallback(
    async (
      selectedText: string,
      action: string,
      isEdit: boolean
    ): Promise<void> => {
      if (!currentFile) return;

      setIsAIChatOpen(true);

      try {
        const formData = new FormData();
        formData.append("input", action);
        formData.append("editorContent", editorContent);
        formData.append("selectedText", selectedText);
        formData.append("inputMode", isEdit ? "edit" : "question");
        formData.append("selectedSources", JSON.stringify([]));

        const userMessage: Message = {
          id: uuidv4(),
          role: "user",
          content: isEdit
            ? `Change this text: "${selectedText}" using this instruction: ${action}`
            : action,
          type: "text",
        };
        await handleAddMessage(userMessage);

        const response = await fetch("/api/process", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: uuidv4(),
          role: "assistant",
          content: isEdit ? "Suggested edit" : data.reply,
          type: isEdit ? "edit" : "text",
          ...(isEdit && { trackedChanges: data.trackedChanges }),
          ...(!isEdit && data.citations && { citations: data.citations }),
        };
        await handleAddMessage(assistantMessage);

        if (isEdit && data.trackedChanges) {
          await handleTrackedChangesUpdate(data.trackedChanges);
        }
      } catch (error) {
        console.error("Error processing custom action:", error);
      }
    },
    [currentFile, editorContent, handleAddMessage, handleTrackedChangesUpdate]
  );

  const handleSave = useCallback(async () => {
    if (!currentFile || isSavingRef.current) return;

    isSavingRef.current = true;
    try {
      const updatedFile = {
        ...currentFile,
        content: editorContent,
        messages,
        trackedChanges,
        isSaved: true,
      };

      const response = await fetch(`/api/files/${currentFile.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedFile),
      });

      if (!response.ok) {
        throw new Error("Failed to save file");
      }

      const savedFile = await response.json();
      lastSavedContentRef.current = editorContent;
      lastContentRef.current = editorContent;
      setCurrentFile(savedFile);
    } catch (error) {
      console.error("Error saving file:", error);
      throw error;
    } finally {
      isSavingRef.current = false;
    }
  }, [currentFile, editorContent, messages, trackedChanges]);

  const handleNameChange = useCallback(
    async (newName: string) => {
      if (!currentFile) return;

      try {
        const response = await fetch(`/api/files/${currentFile.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newName }),
        });

        if (!response.ok) {
          throw new Error("Failed to update file name");
        }

        setCurrentFile((prevFile) => ({
          ...prevFile!,
          name: newName,
          isSaved: false,
        }));
      } catch (error) {
        console.error("Error updating file name:", error);
      }
    },
    [currentFile]
  );

  const handleNavigation = useCallback(
    (path: string) => {
      const hasUnsavedChanges =
        currentFile &&
        (lastSavedContentRef.current !== lastContentRef.current ||
          !!trackedChanges);

      if (hasUnsavedChanges) {
        setShowSaveDialog(true);
        setNavigationPath(path);
      } else {
        router.push(path);
      }
    },
    [currentFile, trackedChanges, router]
  );

  const handleConfirmNavigation = useCallback(async () => {
    setShowSaveDialog(false);
    try {
      await handleSave();
      router.push(navigationPath);
    } catch (error) {
      console.error("Error saving before navigation:", error);
      // Allow user to choose whether to continue without saving
      const shouldContinue = window.confirm(
        "Failed to save changes. Would you like to continue without saving?"
      );
      if (shouldContinue) {
        router.push(navigationPath);
      }
    }
  }, [navigationPath, router, handleSave]);

  const handleCancelNavigation = useCallback(() => {
    setShowSaveDialog(false);
    setNavigationPath("");
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const autoSaveInterval = setInterval(async () => {
      const hasUnsavedChanges =
        currentFile &&
        (lastSavedContentRef.current !== lastContentRef.current ||
          !!trackedChanges);

      if (hasUnsavedChanges && !isSavingRef.current) {
        try {
          await handleSave();
        } catch (error) {
          console.error("Auto-save failed:", error);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [currentFile, trackedChanges, handleSave]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen bg-gray-50">
        <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3 shadow-sm">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex-grow p-4">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!currentFile) {
    return <div>File not found</div>;
  }

  const hasUnsavedChanges =
    lastSavedContentRef.current !== lastContentRef.current || !!trackedChanges;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleNavigation("/")}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            value={currentFile.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xl font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSavingRef.current}
            className="text-gray-600 hover:text-gray-900"
          >
            <Save className="h-5 w-5" />
          </Button>
          <Badge
            variant={hasUnsavedChanges ? "outline" : "secondary"}
            className={`text-xs px-2 py-1 transition-all duration-300 ${
              hasUnsavedChanges
                ? "bg-white text-gray-500 border-gray-300"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            {hasUnsavedChanges ? "Unsaved" : "Saved"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          <Sparkles className="h-5 w-5" />
          AI
        </Button>
      </div>
      <div className="flex flex-grow overflow-hidden relative">
        <div className="flex-grow">
          <Editor
            currentFile={currentFile}
            onContentChange={handleContentChange}
            trackedChanges={trackedChanges}
            onTrackedChangesUpdate={handleTrackedChangesUpdate}
            onQuickAction={handleQuickAction}
            onCustomAction={handleCustomAction}
          />
        </div>
        <AnimatePresence>
          {isAIChatOpen && (
            <>
              <motion.div
                className="fixed inset-0 bg-white z-50 lg:hidden flex flex-col"
                initial={{ opacity: 0, x: "100%" }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: "100%" }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center p-3 border-b border-gray-200">
                  <h2 className="text-lg font-semibold">AI</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAIChatOpen(false)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <div className="flex-grow overflow-y-auto">
                  <AIChat
                    currentFile={currentFile}
                    editorContent={editorTextContent}
                    messages={messages}
                    updateDocumentContent={handleContentChange}
                    addMessage={handleAddMessage}
                    trackedChanges={trackedChanges}
                    onTrackedChangesUpdate={handleTrackedChangesUpdate}
                  />
                </div>
              </motion.div>

              <motion.div
                className="hidden lg:block h-full"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: aiChatWidth, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Resizable
                  size={{ width: aiChatWidth, height: "100%" }}
                  onResizeStop={(e, direction, ref, d) => {
                    setAiChatWidth(aiChatWidth + d.width);
                  }}
                  enable={{ left: true }}
                  minWidth={300}
                  maxWidth={800}
                  className="border-l border-gray-200"
                >
                  <AIChat
                    currentFile={currentFile}
                    editorContent={editorTextContent}
                    messages={messages}
                    updateDocumentContent={handleContentChange}
                    addMessage={handleAddMessage}
                    trackedChanges={trackedChanges}
                    onTrackedChangesUpdate={handleTrackedChangesUpdate}
                  />
                </Resizable>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to save before leaving?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelNavigation}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmNavigation}>
              Save and Leave
            </AlertDialogAction>
            <Button
              variant="ghost"
              onClick={() => {
                setShowSaveDialog(false);
                router.push(navigationPath);
              }}
            >
              Leave without Saving
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CarbonPaper;
