// File: components/FileExplorer/FileExplorer
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  Download,
  MoreVertical,
  Edit2,
  Plus,
  Trash2,
  Grid,
  List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileItem } from "@/types/fileTypes";
import { toast } from "@/hooks/use-toast";
import SkeletonCard from "./SkeletonCard";
import useDelayedState from "@/hooks/useDelayedState"
import { motion, AnimatePresence } from "framer-motion";

const HTMLPreview: React.FC<{ content: string }> = ({ content }) => {
  return (
    <div className="w-full h-full overflow-hidden bg-white">
      <iframe
        srcDoc={content}
        title="HTML Preview"
        className="w-full h-full pointer-events-none transform scale-50 origin-top-left"
        style={{ width: "200%", height: "200%" }}
      />
    </div>
  );
};

const FileExplorer: React.FC = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false);
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [isLoading, setIsLoading] = useDelayedState(true, 1000); // Minimum 1 second loading time

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/files");
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        throw new Error("Failed to fetch files");
      }
    } catch (error) {
      console.error("Error fetching files:", error);
      toast({
        title: "Error",
        description: "Failed to load files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}`);
      if (response.ok) {
        router.push(`/editor/${file.id}`);
      } else {
        throw new Error("Failed to fetch file");
      }
    } catch (error) {
      console.error("Error selecting file:", error);
      toast({
        title: "Error",
        description: "Failed to open the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const response = await fetch("/api/files", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name: file.name, content }),
          });
          if (response.ok) {
            const newFile = await response.json();
            setFiles((prevFiles) => [...prevFiles, newFile]);
            toast({
              title: "Success",
              description: "File uploaded successfully.",
            });
          } else {
            throw new Error("Failed to upload file");
          }
        } catch (error) {
          console.error("Error uploading file:", error);
          toast({
            title: "Error",
            description: "Failed to upload file. Please try again.",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleFileExport = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}`);
      if (response.ok) {
        const fileData = await response.json();
        const blob = new Blob([fileData.content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        throw new Error("Failed to export file");
      }
    } catch (error) {
      console.error("Error exporting file:", error);
      toast({
        title: "Error",
        description: "Failed to export file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const startRenaming = (fileId: string, fileName: string) => {
    setEditingFile(fileId);
    setNewFileName(fileName);
  };

  const handleRename = async () => {
    if (editingFile && newFileName) {
      try {
        const response = await fetch(`/api/files/${editingFile}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newFileName }),
        });
        if (response.ok) {
          await fetchFiles();
          toast({
            title: "Success",
            description: "File renamed successfully.",
          });
        } else {
          throw new Error("Failed to rename file");
        }
      } catch (error) {
        console.error("Error renaming file:", error);
        toast({
          title: "Error",
          description: "Failed to rename file. Please try again.",
          variant: "destructive",
        });
      }
    }
    setEditingFile(null);
  };

  const handleFileAdd = async () => {
    if (newFileNameInput.trim() === "") return;

    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newFileNameInput,
          content: `<h1>${newFileNameInput}</h1><p>Start writing here...</p>`,
        }),
      });
      if (response.ok) {
        await fetchFiles();
        setIsNewFileDialogOpen(false);
        setNewFileNameInput("");
        toast({
          title: "Success",
          description: "New file created successfully.",
        });
      } else {
        throw new Error("Failed to add new file");
      }
    } catch (error) {
      console.error("Error adding new file:", error);
      toast({
        title: "Error",
        description: "Failed to create new file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await fetchFiles();
        toast({
          title: "Success",
          description: "File deleted successfully.",
        });
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      toast({
        title: "Error",
        description: "Failed to delete file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-semibold">CarbonPaper</h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setIsNewFileDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
          <Button
            variant="outline"
            onClick={() => document.getElementById("fileInput")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
          <Input
            id="fileInput"
            type="file"
            accept=".html,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
          >
            {viewMode === "grid" ? (
              <List className="h-4 w-4" />
            ) : (
              <Grid className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={isLoading ? 'loading' : 'content'}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            className={`grid gap-4 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "grid-cols-1"
            }`}
          >
            {isLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <SkeletonCard key={index} viewMode={viewMode} />
                ))
              : files.map((file) => (
                  <Card
                    key={file.id}
                    className="cursor-pointer transition-opacity duration-300"
                    onClick={() => handleFileSelect(file)}
                  >
                    <CardContent className="p-4">
                      {viewMode === "grid" && (
                        <div className="aspect-video mb-2 bg-muted flex items-center justify-center overflow-hidden">
                          <HTMLPreview content={file.content} />
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        {editingFile === file.id ? (
                          <Input
                            value={newFileName}
                            onChange={(e) => setNewFileName(e.target.value)}
                            onBlur={handleRename}
                            onKeyPress={(e) => e.key === "Enter" && handleRename()}
                            autoFocus
                            className="text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium truncate">
                            {file.name}
                          </span>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                startRenaming(file.id, file.name);
                              }}
                            >
                              <Edit2 className="h-4 w-4 mr-2" /> Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileExport(file);
                              }}
                            >
                              <Download className="h-4 w-4 mr-2" /> Export
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFileDelete(file.id);
                              }}
                              className="text-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {!file.isSaved && (
                        <span className="text-xs text-yellow-500">Unsaved changes</span>
                      )}
                    </CardContent>
                  </Card>
                ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>Enter a name for your new document.</DialogDescription>
          </DialogHeader>
          <Input
            value={newFileNameInput}
            onChange={(e) => setNewFileNameInput(e.target.value)}
            placeholder="Enter document name"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsNewFileDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleFileAdd}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FileExplorer;