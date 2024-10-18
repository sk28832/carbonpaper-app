// File: components/Layout/CarbonPaper.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Resizable } from "re-resizable";
import Editor from "../Editor/Editor";
import AIChat from "../AIChat/AIChat";
import { ArrowLeft, Save, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileItem } from "@/types/fileTypes";
import useDelayedState from "@/hooks/useDelayedState"

interface CarbonPaperProps {
  fileId: string;
}

const CarbonPaper: React.FC<CarbonPaperProps> = ({ fileId }) => {
  const router = useRouter();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [aiChatWidth, setAiChatWidth] = useState(400);
  const [isLoading, setIsLoading] = useDelayedState(true, 1000); // Minimum 1 second loading time

  useEffect(() => {
    const fetchFile = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/files/${fileId}`);
        if (response.ok) {
          const file = await response.json();
          setCurrentFile(file);
        } else {
          console.error("Failed to fetch file");
          router.push("/");
        }
      } catch (error) {
        console.error("Error fetching file:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFile();
  }, [fileId, router]);

  const handleContentChange = useCallback(
    (newContent: string) => {
      if (currentFile) {
        setCurrentFile((prevFile) => ({
          ...prevFile!,
          content: newContent,
          isSaved: false,
        }));
      }
    },
    [currentFile]
  );

  const handleSave = useCallback(async () => {
    if (currentFile) {
      try {
        const response = await fetch(`/api/files/${currentFile.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(currentFile),
        });
        if (response.ok) {
          setCurrentFile((prevFile) => ({
            ...prevFile!,
            isSaved: true,
          }));
        } else {
          console.error("Failed to save file");
        }
      } catch (error) {
        console.error("Error saving file:", error);
      }
    }
  }, [currentFile]);

  const handleNameChange = useCallback(
    async (newName: string) => {
      if (currentFile) {
        try {
          const response = await fetch(`/api/files/${currentFile.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: newName }),
          });
          if (response.ok) {
            setCurrentFile((prevFile) => ({
              ...prevFile!,
              name: newName,
              isSaved: false,
            }));
          } else {
            console.error("Failed to update file name");
          }
        } catch (error) {
          console.error("Error updating file name:", error);
        }
      }
    },
    [currentFile]
  );

  const LoadingSkeleton = () => (
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

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={isLoading ? 'loading' : 'content'}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        {isLoading ? (
          <LoadingSkeleton />
        ) : !currentFile ? (
          <div>File not found</div>
        ) : (
          <div className="flex flex-col h-screen bg-gray-50">
            <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3 shadow-sm">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push("/")}
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
                  disabled={currentFile.isSaved}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Save className="h-5 w-5" />
                </Button>
                <Badge
                  variant={currentFile.isSaved ? "secondary" : "outline"}
                  className={`text-xs px-2 py-1 transition-all duration-300 ${
                    currentFile.isSaved
                      ? "bg-gray-200 text-gray-700"
                      : "bg-white text-gray-500 border-gray-300"
                  }`}
                >
                  {currentFile.isSaved ? "Saved" : "Unsaved"}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAIChatOpen(!isAIChatOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                <MessageSquare className="h-5 w-5 mr-2" />
                AI Chat
              </Button>
            </div>
            <div className="flex flex-grow overflow-hidden relative">
              <div className="flex-grow">
                <Editor
                  currentFile={currentFile}
                  onContentChange={handleContentChange}
                />
              </div>
              <AnimatePresence>
                {isAIChatOpen && (
                  <>
                    {/* Mobile full-screen overlay */}
                    <motion.div
                      className="fixed inset-0 bg-white z-50 lg:hidden flex flex-col"
                      initial={{ opacity: 0, x: "100%" }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: "100%" }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex justify-between items-center p-3 border-b border-gray-200">
                        <h2 className="text-lg font-semibold">AI Chat</h2>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsAIChatOpen(false)}
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>
                      <div className="flex-grow overflow-y-auto">
                        <AIChat isOpen={isAIChatOpen} />
                      </div>
                    </motion.div>

                    {/* Desktop Resizable AI Chat */}
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
                        <AIChat isOpen={isAIChatOpen} />
                      </Resizable>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default CarbonPaper;