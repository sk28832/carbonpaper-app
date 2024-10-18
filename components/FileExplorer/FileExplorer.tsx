// File: components/FileExplorer/FileExplorer.tsx
'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Upload, Download, MoreVertical, Edit2, Plus, Trash2, Grid, List, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileItem } from "@/types/fileTypes";

const FileExplorer: React.FC = () => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState<string>("");
  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch('/api/files');
      if (response.ok) {
        const data = await response.json();
        setFiles(data);
      } else {
        console.error('Failed to fetch files');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    router.push(`/editor/${file.id}`);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const content = e.target?.result as string;
        try {
          const response = await fetch('/api/files', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: file.name, content }),
          });
          if (response.ok) {
            const newFile = await response.json();
            setFiles(prevFiles => [...prevFiles, newFile]);
          } else {
            console.error('Failed to upload file');
          }
        } catch (error) {
          console.error('Error uploading file:', error);
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
        console.error('Failed to export file');
      }
    } catch (error) {
      console.error('Error exporting file:', error);
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
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newFileName }),
        });
        if (response.ok) {
          fetchFiles();
        } else {
          console.error('Failed to rename file');
        }
      } catch (error) {
        console.error('Error renaming file:', error);
      }
    }
    setEditingFile(null);
  };

  const handleFileAdd = async () => {
    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "New Document",
          content: "<h1>New Document</h1><p>Start writing here...</p>",
        }),
      });
      if (response.ok) {
        fetchFiles();
      } else {
        console.error('Failed to add new file');
      }
    } catch (error) {
      console.error('Error adding new file:', error);
    }
  };

  const handleFileDelete = async (fileId: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        fetchFiles();
      } else {
        console.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">CarbonPaper</h1>
        <div className="flex items-center space-x-2">
          <Button onClick={handleFileAdd}>
            <Plus className="mr-2 h-4 w-4" /> New
          </Button>
          <Button variant="outline" onClick={() => document.getElementById("fileInput")?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Upload
          </Button>
          <Input
            id="fileInput"
            type="file"
            accept=".html,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button variant="outline" size="icon" onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}>
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {files.map((file) => (
          <Card key={file.id} className="cursor-pointer" onClick={() => handleFileSelect(file)}>
            <CardContent className="p-4">
              {viewMode === 'grid' && (
                <div className="aspect-video mb-2 bg-muted flex items-center justify-center">
                  <FileText className="h-12 w-12 text-gray-400" />
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
                  <span className="text-sm font-medium truncate">{file.name}</span>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); startRenaming(file.id, file.name); }}>
                      <Edit2 className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFileExport(file); }}>
                      <Download className="h-4 w-4 mr-2" /> Export
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleFileDelete(file.id); }} className="text-red-500">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              {!file.isSaved && <span className="text-xs text-yellow-500">Unsaved changes</span>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FileExplorer;