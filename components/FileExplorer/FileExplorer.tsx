// File: components/FileExplorer/FileExplorer.tsx
import React, { useState } from 'react';
import { Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface FileExplorerProps {
  isOpen: boolean;
  onToggle: () => void;
  onFileSelect: (fileName: string, content: string) => void;
}

interface FileItem {
  name: string;
  content: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ isOpen, onToggle, onFileSelect }) => {
  const [files, setFiles] = useState<FileItem[]>([]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        const newFile = { name: file.name, content };
        setFiles([...files, newFile]);
        onFileSelect(file.name, content);
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

  return (
    <div className={`h-full bg-white border-r border-gray-200 p-4 ${isOpen ? '' : 'hidden'}`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Files</h2>
      </div>
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
          <li
            key={index}
            className="cursor-pointer hover:bg-gray-100 p-2 rounded"
            onClick={() => onFileSelect(file.name, file.content)}
          >
            {file.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileExplorer;