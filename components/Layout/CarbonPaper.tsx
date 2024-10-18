// File: components/Layout/CarbonPaper.tsx
"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import FileExplorer from "../FileExplorer/FileExplorer";
import Editor from "../Editor/Editor";
import AIChat from "../AIChat/AIChat";
import { PanelLeft, BotIcon, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileItem } from "@/types/fileTypes";

const CarbonPaper: React.FC = () => {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem>({
    id: "default",
    name: "Untitled",
    content:
      "<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>",
    isSaved: true,
  });
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingFileSelect, setPendingFileSelect] = useState<FileItem | null>(
    null
  );
  const [isEditingFileName, setIsEditingFileName] = useState(false);
  const currentFileIdRef = useRef(currentFile.id);

  useEffect(() => {
    setFiles([currentFile]);
  }, []);

  useEffect(() => {
    currentFileIdRef.current = currentFile.id;
  }, [currentFile]);

  const handleFileSelect = (file: FileItem) => {
    if (currentFile && !currentFile.isSaved) {
      setPendingFileSelect(file);
      setIsDialogOpen(true);
    } else {
      setCurrentFile(file);
      setFiles((prevFiles) => [...prevFiles]);
    }
  };

  const handleDialogConfirm = () => {
    handleSave();
    if (pendingFileSelect) {
      setCurrentFile(pendingFileSelect);
      setPendingFileSelect(null);
    }
    setIsDialogOpen(false);
  };

  const handleDialogCancel = () => {
    if (pendingFileSelect) {
      setCurrentFile(pendingFileSelect);
      setPendingFileSelect(null);
    }
    setIsDialogOpen(false);
  };

  const handleFileRename = (fileId: string, newName: string) => {
    setFiles((prevFiles) => {
      const newFiles = prevFiles.map((file) =>
        file.id === fileId ? { ...file, name: newName, isSaved: false } : file
      );
      return newFiles;
    });
    if (currentFile.id === fileId) {
      setCurrentFile((prevFile) => ({
        ...prevFile,
        name: newName,
        isSaved: false,
      }));
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    setCurrentFile((prevFile) => {
      const updatedFile = { ...prevFile, content: newContent, isSaved: false };
      return updatedFile;
    });
    setFiles((prevFiles) => {
      const newFiles = prevFiles.map((file) =>
        file.id === currentFileIdRef.current
          ? { ...file, content: newContent, isSaved: false }
          : file
      );
      return newFiles;
    });
  }, []);

  const handleSave = useCallback(() => {
    setCurrentFile((prevFile) => {
      const updatedFile = { ...prevFile, isSaved: true };
      return updatedFile;
    });
    setFiles((prevFiles) => {
      const newFiles = prevFiles.map((file) =>
        file.id === currentFileIdRef.current ? { ...file, isSaved: true } : file
      );
      return newFiles;
    });
  }, []);

  const handleFileAdd = (file: FileItem) => {
    const newFile = { ...file, id: Date.now().toString(), isSaved: true };
    setFiles((prevFiles) => [...prevFiles, newFile]);
    setCurrentFile(newFile);
  };

  const handleFileDelete = (fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    if (currentFile.id === fileId) {
      const remainingFiles = files.filter((file) => file.id !== fileId);
      if (remainingFiles.length > 0) {
        setCurrentFile(remainingFiles[0]);
      } else {
        setCurrentFile({
          id: "default",
          name: "Untitled",
          content:
            "<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>",
          isSaved: true,
        });
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
            className="text-gray-600 hover:text-gray-900"
          >
            <PanelLeft className="h-5 w-5" />
          </Button>
          {isEditingFileName ? (
            <Input
              value={currentFile.name}
              onChange={(e) => handleFileRename(currentFile.id, e.target.value)}
              onBlur={() => setIsEditingFileName(false)}
              onKeyPress={(e) =>
                e.key === "Enter" && setIsEditingFileName(false)
              }
              autoFocus
              className="text-xl font-semibold text-gray-800 w-64"
            />
          ) : (
            <h2
              className="text-xl font-semibold text-gray-800 cursor-pointer"
              onClick={() => setIsEditingFileName(true)}
            >
              {currentFile?.name || "Untitled"}
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={currentFile.isSaved}
            className="text-gray-600 hover:text-gray-900"
          >
            <Save className="h-5 w-5" />
          </Button>
          {currentFile.isSaved ? (
            <span className="text-green-500 text-sm flex items-center">
              Saved
            </span>
          ) : (
            <span className="text-yellow-500 text-sm flex items-center">
              Unsaved
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          <BotIcon className="h-5 w-5" />
        </Button>
      </div>
      <div className="flex flex-grow overflow-hidden">
      <AnimatePresence>
  {isFileExplorerOpen && (
    <motion.div
      initial={{ width: 0, x: -300 }} // Start with no width and off-screen
      animate={{ width: "auto", x: 0 }} // Animate to visible width and position
      exit={{ width: 0, x: -300 }} // Shrink and slide out
      transition={{ duration: 0.3 }} // Smooth transition
    >
      <FileExplorer
        isOpen={isFileExplorerOpen}
        files={files}
        onFileSelect={handleFileSelect}
        onFileRename={handleFileRename}
        onFileAdd={handleFileAdd}
        onFileDelete={handleFileDelete}
        currentFileId={currentFile.id}
      />
    </motion.div>
  )}
</AnimatePresence>


        <div className="flex-grow">
          <Editor
            currentFile={currentFile}
            onContentChange={handleContentChange}
          />
        </div>
        <AnimatePresence>
          {isAIChatOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "auto", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AIChat isOpen={isAIChatOpen} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save before switching
              files?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={handleDialogCancel}>
              Don't Save
            </Button>
            <Button onClick={handleDialogConfirm}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarbonPaper;
