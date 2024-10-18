// File: components/Layout/CarbonPaper.tsx
'use client'

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Editor from "../Editor/Editor";
import AIChat from "../AIChat/AIChat";
import { ArrowLeft, Save, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { FileItem } from "@/types/fileTypes";

interface CarbonPaperProps {
  fileId: string;
}

const CarbonPaper: React.FC<CarbonPaperProps> = ({ fileId }) => {
  const router = useRouter();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileItem | null>(null);

  useEffect(() => {
    const fetchFile = async () => {
      try {
        const response = await fetch(`/api/files/${fileId}`);
        if (response.ok) {
          const file = await response.json();
          setCurrentFile(file);
        } else {
          console.error('Failed to fetch file');
          router.push('/');
        }
      } catch (error) {
        console.error('Error fetching file:', error);
        router.push('/');
      }
    };

    fetchFile();
  }, [fileId, router]);

  const handleContentChange = useCallback((newContent: string) => {
    if (currentFile) {
      setCurrentFile(prevFile => ({
        ...prevFile!,
        content: newContent,
        isSaved: false,
      }));
    }
  }, [currentFile]);

  const handleSave = useCallback(async () => {
    if (currentFile) {
      try {
        const response = await fetch(`/api/files/${currentFile.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currentFile),
        });
        if (response.ok) {
          setCurrentFile(prevFile => ({
            ...prevFile!,
            isSaved: true,
          }));
        } else {
          console.error('Failed to save file');
        }
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  }, [currentFile]);

  const handleNameChange = useCallback(async (newName: string) => {
    if (currentFile) {
      try {
        const response = await fetch(`/api/files/${currentFile.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName }),
        });
        if (response.ok) {
          setCurrentFile(prevFile => ({
            ...prevFile!,
            name: newName,
            isSaved: false,
          }));
        } else {
          console.error('Failed to update file name');
        }
      } catch (error) {
        console.error('Error updating file name:', error);
      }
    }
  }, [currentFile]);

  if (!currentFile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between bg-white border-b border-gray-200 p-3 shadow-sm">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            type="text"
            value={currentFile.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xl font-semibold text-gray-800 bg-transparent border-none focus:outline-none focus:ring-0"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={currentFile.isSaved}
            className="text-gray-600 hover:text-gray-900"
          >
            <Save className="h-5 w-5" />
          </Button>
          <Badge 
            variant={currentFile.isSaved ? "secondary" : "outline"} 
            className={`text-xs px-2 py-1 transition-all duration-300 ${
              currentFile.isSaved ? 'bg-gray-200 text-gray-700' : 'bg-white text-gray-500 border-gray-300'
            }`}
          >
            {currentFile.isSaved ? "Saved" : "Unsaved"}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAIChatOpen(!isAIChatOpen)}
          className="text-gray-600 hover:text-gray-900"
        >
          <MessageSquare className="h-5 w-5 mr-2" />
          AI Chat
        </Button>
      </div>
      <div className="flex flex-grow overflow-hidden">
        <div className="flex-grow">
          <Editor
            currentFile={currentFile}
            onContentChange={handleContentChange}
          />
        </div>
        {isAIChatOpen && (
          <div className="w-64 border-l border-gray-200">
            <AIChat isOpen={isAIChatOpen} />
          </div>
        )}
      </div>
    </div>
  );
};

export default CarbonPaper;