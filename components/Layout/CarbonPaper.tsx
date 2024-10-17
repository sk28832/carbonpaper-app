// File: components/Layout/CarbonPaper.tsx
"use client"
import React, { useState } from 'react';
import FileExplorer from '../FileExplorer/FileExplorer';
import Editor from '../Editor/Editor';
import AIChat from '../AIChat/AIChat';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
    <div className="flex h-screen bg-gray-100">
      <div className={`${isFileExplorerOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out`}>
        <FileExplorer 
          isOpen={isFileExplorerOpen} 
          onToggle={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
          onFileSelect={handleFileSelect}
        />
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 left-2 z-10"
        onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
      >
        {isFileExplorerOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </Button>
      <div className="flex-grow flex flex-col">
        <Editor 
          currentFile={currentFile} 
          initialContent={fileContent}
          onContentChange={(newContent) => setFileContent(newContent)}
        />
      </div>
      <div className={`${isAIChatOpen ? 'w-64' : 'w-0'} transition-all duration-300 ease-in-out`}>
        <AIChat
          isOpen={isAIChatOpen}
          onToggle={() => setIsAIChatOpen(!isAIChatOpen)}
        />
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-2 right-2 z-10"
        onClick={() => setIsAIChatOpen(!isAIChatOpen)}
      >
        {isAIChatOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default CarbonPaper;