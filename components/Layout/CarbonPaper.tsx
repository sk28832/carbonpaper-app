// File: components/Layout/CarbonPaper.tsx
"use client"
import React, { useState } from 'react';
import FileExplorer from '../FileExplorer/FileExplorer';
import Editor from '../Editor/Editor';
import AIChat from '../AIChat/AIChat';
import { PanelLeft, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CarbonPaper: React.FC = () => {
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>('');

  const handleFileSelect = (fileName: string, content: string) => {
    setCurrentFile(fileName);
    setFileContent(content);
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
          <h2 className="text-xl font-semibold">{currentFile || 'Untitled'}</h2>
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
          onFileSelect={handleFileSelect}
        />
        <div className="flex-grow">
          <Editor 
            currentFile={currentFile} 
            initialContent={fileContent}
            onContentChange={(newContent) => setFileContent(newContent)}
          />
        </div>
        <AIChat isOpen={isAIChatOpen} />
      </div>
    </div>
  );
};

export default CarbonPaper;