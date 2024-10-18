// File: components/Layout/CarbonPaper.tsx
"use client";
import React, { useState, useCallback, useEffect, useRef } from "react";
import FileExplorer from "../FileExplorer/FileExplorer";
import Editor from "../Editor/Editor";
import AIChat from "../AIChat/AIChat";
import { PanelLeft, BotIcon, Save, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    content: "<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>",
    isSaved: true,
  });
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingFileSelect, setPendingFileSelect] = useState<FileItem | null>(null);
  const currentFileIdRef = useRef(currentFile.id);

  useEffect(() => {
    setFiles([currentFile]);
    console.log("Initial files set:", [currentFile]);
  }, []);

  useEffect(() => {
    console.log("Current file updated:", currentFile);
    currentFileIdRef.current = currentFile.id;
  }, [currentFile]);

  const handleFileSelect = (file: FileItem) => {
    console.log("File selected:", file);
    if (currentFile && !currentFile.isSaved) {
      console.log("Current file not saved, opening dialog");
      setPendingFileSelect(file);
      setIsDialogOpen(true);
    } else {
      console.log("Setting current file:", file);
      setCurrentFile(file);
      // Force update
      setFiles(prevFiles => [...prevFiles]);
    }
  };

  const handleDialogConfirm = () => {
    console.log("Dialog confirmed, saving current file");
    handleSave();
    if (pendingFileSelect) {
      console.log("Setting current file to pending select:", pendingFileSelect);
      setCurrentFile(pendingFileSelect);
      setPendingFileSelect(null);
    }
    setIsDialogOpen(false);
  };

  const handleDialogCancel = () => {
    console.log("Dialog cancelled");
    if (pendingFileSelect) {
      console.log("Setting current file to pending select:", pendingFileSelect);
      setCurrentFile(pendingFileSelect);
      setPendingFileSelect(null);
    }
    setIsDialogOpen(false);
  };

  const handleFileRename = (fileId: string, newName: string) => {
    console.log(`Renaming file with id ${fileId} to ${newName}`);
    setFiles((prevFiles) => {
      const newFiles = prevFiles.map((file) =>
        file.id === fileId
          ? { ...file, name: newName, isSaved: false }
          : file
      );
      console.log("Updated files after rename:", newFiles);
      return newFiles;
    });
    if (currentFile.id === fileId) {
      console.log("Updating current file name");
      setCurrentFile((prevFile) => ({ ...prevFile, name: newName, isSaved: false }));
    }
  };

  const handleContentChange = useCallback(
    (newContent: string) => {
      console.log("Content changed for file:", currentFile.name, "with id:", currentFileIdRef.current);
      setCurrentFile((prevFile) => {
        const updatedFile = { ...prevFile, content: newContent, isSaved: false };
        console.log("Updated current file:", updatedFile);
        return updatedFile;
      });
      setFiles((prevFiles) => {
        const newFiles = prevFiles.map((file) =>
          file.id === currentFileIdRef.current
            ? { ...file, content: newContent, isSaved: false }
            : file
        );
        console.log("Updated files after content change:", newFiles);
        return newFiles;
      });
    },
    []
  );

  const handleSave = useCallback(() => {
    console.log("Saving file:", currentFile.name, "with id:", currentFileIdRef.current);
    setCurrentFile((prevFile) => {
      const updatedFile = { ...prevFile, isSaved: true };
      console.log("Updated current file after save:", updatedFile);
      return updatedFile;
    });
    setFiles((prevFiles) => {
      const newFiles = prevFiles.map((file) =>
        file.id === currentFileIdRef.current ? { ...file, isSaved: true } : file
      );
      console.log("Updated files after save:", newFiles);
      return newFiles;
    });
  }, []);

  const handleFileAdd = (file: FileItem) => {
    console.log("Adding new file:", file);
    const newFile = { ...file, id: Date.now().toString(), isSaved: true };
    setFiles((prevFiles) => {
      const newFiles = [...prevFiles, newFile];
      console.log("Updated files after add:", newFiles);
      return newFiles;
    });
    console.log("Setting current file to new file:", newFile);
    setCurrentFile(newFile);
    // Force update
    setFiles(prevFiles => [...prevFiles]);
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (files.some(file => !file.isSaved)) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [files]);

  console.log("Current render state - currentFile:", currentFile, "files:", files);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <div className="flex items-center justify-between bg-white border-b border-gray-200 p-2">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
            className="mr-2"
          >
            <PanelLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-xl font-semibold mr-2">
            {currentFile?.name || "Untitled"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={currentFile.isSaved}
          >
            <Save className="h-4 w-4" />
          </Button>
          {currentFile.isSaved && (
            <span className="text-green-500 ml-2 flex items-center">
              <Check className="h-4 w-4 mr-1" />
              Saved
            </span>
          )}
          {!currentFile.isSaved && (
            <span className="text-yellow-500 ml-2">Not saved</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        >
          <BotIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-grow overflow-hidden">
        <FileExplorer
          isOpen={isFileExplorerOpen}
          files={files}
          onFileSelect={handleFileSelect}
          onFileRename={handleFileRename}
          onFileAdd={handleFileAdd}
          currentFileId={currentFile.id}
        />
        <div className="flex-grow">
          <Editor
            currentFile={currentFile}
            onContentChange={handleContentChange}
          />
        </div>
        <AIChat isOpen={isAIChatOpen} />
      </div>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save before switching files?
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