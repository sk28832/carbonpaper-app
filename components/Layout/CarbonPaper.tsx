// File: components/Layout/CarbonPaper.tsx
"use client"
import React, { useState, useCallback } from 'react';
import FileExplorer from '../FileExplorer/FileExplorer';
import Editor from '../Editor/Editor';
import AIChat from '../AIChat/AIChat';
import { PanelLeft, PanelRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FileItem {
  name: string;
  content: string;
}

const CarbonPaper: React.FC = () => {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);

  const handleFileSelect = (file: FileItem) => {
    setCurrentFile(file);
  };

  const handleFileRename = (oldName: string, newName: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.name === oldName ? { ...file, name: newName } : file
      )
    );
    if (currentFile && currentFile.name === oldName) {
      setCurrentFile({ ...currentFile, name: newName });
    }
  };

  const handleContentChange = useCallback((newContent: string) => {
    if (currentFile) {
      setCurrentFile({ ...currentFile, content: newContent });
    }
  }, [currentFile]);

  const handleSave = () => {
    if (currentFile) {
      setFiles(prevFiles => 
        prevFiles.map(file => 
          file.name === currentFile.name ? currentFile : file
        )
      );
    }
  };

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
          <h2 className="text-xl font-semibold mr-2">{currentFile?.name || 'Untitled'}</h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
          </Button>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
        >
          <PanelRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-grow overflow-hidden">
        <FileExplorer 
          isOpen={isFileExplorerOpen}
          files={files}
          onFileSelect={handleFileSelect}
          onFileRename={handleFileRename}
          onFileAdd={(file) => setFiles([...files, file])}
        />
        <div className="flex-grow">
          <Editor 
            currentFile={currentFile} 
            onContentChange={handleContentChange}
            onBlur={handleSave}
          />
        </div>
        <AIChat isOpen={isAIChatOpen} />
      </div>
    </div>
  );
};

export default CarbonPaper;