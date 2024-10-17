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

interface FileExplorerProps {
  isOpen: boolean;
  onFileSelect: (fileName: string, content: string) => void;
}

interface FileItem {
  name: string;
  content: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [editingFile, setEditingFile] = useState<string | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = { name: file.name, content };
        setFiles(prevFiles => [...prevFiles, newFile]);
        onFileSelect(file.name, content); // Automatically select the imported file
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

  const handleRename = (index: number, newName: string) => {
    const newFiles = [...files];
    newFiles[index].name = newName;
    setFiles(newFiles);
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
          {files.map((file, index) => (
            <li key={index} className="flex items-center justify-between bg-white p-2 rounded-md shadow-sm">
              {editingFile === file.name ? (
                <Input
                  value={file.name}
                  onChange={(e) => handleRename(index, e.target.value)}
                  onBlur={() => setEditingFile(null)}
                  onKeyPress={(e) => e.key === 'Enter' && handleRename(index, (e.target as HTMLInputElement).value)}
                  autoFocus
                />
              ) : (
                <span className="cursor-pointer truncate flex-grow" onClick={() => onFileSelect(file.name, file.content)}>
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
                  <DropdownMenuItem onClick={() => setEditingFile(file.name)}>
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