// File: components/FileExplorer/FileExplorer.tsx
import React, { useState } from 'react';
import { Upload, Download, MoreVertical, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface FileItem {
  name: string;
  content: string;
}

interface FileExplorerProps {
  isOpen: boolean;
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  onFileRename: (oldName: string, newName: string) => void;
  onFileAdd: (file: FileItem) => void;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, files, onFileSelect, onFileRename, onFileAdd }) => {
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = { name: file.name, content };
        onFileAdd(newFile);
        onFileSelect(newFile);
      };
      reader.readAsText(file);
    }
  };

  const handleFileExport = () => {
    if (files.length > 0) {
      const lastFile = files[files.length - 1];
      const blob = new Blob([lastFile.content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = lastFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const startRenaming = (fileName: string) => {
    setEditingFile(fileName);
    setNewFileName(fileName);
  };

  const handleRename = () => {
    if (editingFile && newFileName && newFileName !== editingFile) {
      onFileRename(editingFile, newFileName);
    }
    setEditingFile(null);
  };

  if (!isOpen) return null;

  return (
    <div className="w-64 h-full bg-gray-50 border-r border-gray-200 overflow-auto">
      <div className="p-4">
        <div className="flex space-x-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => document.getElementById('fileInput')?.click()}>
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
          <Button variant="outline" size="sm" onClick={handleFileExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <ul className="space-y-2">
          {files.map((file) => (
            <li key={file.name} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
              {editingFile === file.name ? (
                <Input
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  onBlur={handleRename}
                  onKeyPress={(e) => e.key === 'Enter' && handleRename()}
                  autoFocus
                />
              ) : (
                <span className="cursor-pointer truncate flex-grow" onClick={() => onFileSelect(file)}>
                  {file.name}
                </span>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => startRenaming(file.name)}>
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