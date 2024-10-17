"use client"
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from './ui/input';

const CarbonPaper = () => {
  const [html, setHtml] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeIframe();
      isInitializedRef.current = true;
    } else {
      updateIframeContent();
    }
  }, [html]);

  const initializeIframe = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <style>
                body {
                  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                  padding: 40px;
                  color: #333;
                  background-color: white;
                  line-height: 1.6;
                  width: 100%;
                  max-width: 900px;
                  margin: 0 auto;
                  min-height: 100vh;
                }
                body[contenteditable="true"] { outline: none; }
                h1 { color: #2c3e50; }
              </style>
            </head>
            <body contenteditable="true"></body>
          </html>
        `);
        doc.close();
        attachIframeListeners(doc);
        doc.body.innerHTML = html || '<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>';
      }
    }
  };

  const updateIframeContent = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc && doc.body.innerHTML !== html) {
        const selection = doc.getSelection();
        let range: Range | null = null;
        let startContainer: Node | null = null;
        let startOffset: number = 0;
        
        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
          startContainer = range.startContainer;
          startOffset = range.startOffset;
        }
  
        doc.body.innerHTML = html;
  
        if (range && startContainer) {
          const newRange = doc.createRange();
          let newStartContainer: Node | null = startContainer;
  
          while (newStartContainer && !doc.body.contains(newStartContainer)) {
            newStartContainer = newStartContainer.parentNode;
          }
  
          if (newStartContainer) {
            newRange.setStart(newStartContainer, startOffset);
            newRange.collapse(true);
  
            selection?.removeAllRanges();
            selection?.addRange(newRange);
          }
        }
      }
    }
  };

  const attachIframeListeners = (doc: Document) => {
    const updateHtml = () => {
      if (doc.body.innerHTML !== html) {
        setHtml(doc.body.innerHTML);
      }
    };
    doc.body.addEventListener('input', updateHtml);
    doc.body.addEventListener('blur', updateHtml);
  };

  const handleImport = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const text = await file.text();
      setHtml(text);
    }
  };

  const handleExport = () => {
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'exported.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">CarbonPaper</h1>
        <div className="flex space-x-4">
          <Button onClick={handleImport} variant="outline" className="bg-white hover:bg-gray-100">
            Import
          </Button>
          <Button onClick={handleExport} variant="outline" className="bg-white hover:bg-gray-100">
            Export
          </Button>
          <Input
            type="file"
            ref={fileInputRef}
            accept=".html"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </header>
      <main className="flex-grow p-6 flex justify-center overflow-auto">
        <div className="w-full max-w-5xl bg-white rounded-lg shadow-md">
          <iframe
            ref={iframeRef}
            className="w-full h-full"
            title="CarbonPaper Editor"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      </main>
    </div>
  );
};

export default CarbonPaper;