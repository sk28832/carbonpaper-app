// File: components/FileExplorer/FileExplorer.tsx
import React, { useState } from "react";
import { Upload, Download, MoreVertical, Edit2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileItem } from "@/types/fileTypes";


interface FileExplorerProps {
  isOpen: boolean;
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileRename: (fileId: string, newName: string) => void;
  onFileAdd: (file: FileItem) => void;
  currentFileId: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  isOpen,
  files,
  onFileSelect,
  onFileRename,
  onFileAdd,
  currentFileId,
}) => {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = { id: Date.now().toString(), name: file.name, content, isSaved: true };
        onFileAdd(newFile);
      };
      reader.readAsText(file);
    }
  };

  const handleFileExport = () => {
    if (files.length > 0) {
      const currentFile = files.find(file => file.id === currentFileId);
      if (currentFile) {
        const blob = new Blob([currentFile.content], { type: "text/html" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = currentFile.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }
  };

  const startRenaming = (fileId: string, fileName: string) => {
    setEditingFile(fileId);
    setNewFileName(fileName);
  };

  const handleRename = () => {
    if (editingFile && newFileName) {
      onFileRename(editingFile, newFileName);
    }
    setEditingFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-white border-r border-gray-200 overflow-auto">
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById("fileInput")?.click()}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Input
            id="fileInput"
            type="file"
            accept=".html"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" size="sm" onClick={handleFileExport} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <Button
          variant="default"
          size="sm"
          onClick={() => onFileAdd({ id: Date.now().toString(), name: "New File", content: "", isSaved: false })}
          className="w-full mb-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          New File
        </Button>
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className={`flex items-center justify-between bg-gray-50 p-2 rounded-md ${
                file.id === currentFileId ? 'border-2 border-blue-500' : 'border border-gray-200'
              }`}
            >
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
                <span
                  className="cursor-pointer truncate flex-grow text-sm text-gray-800"
                  onClick={() => onFileSelect(file)}
                >
                  {file.name}{" "}
                  {!file.isSaved && (
                    <span className="text-yellow-500 ml-1">*</span>
                  )}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => startRenaming(file.id, file.name)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default FileExplorer;