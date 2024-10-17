"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "./ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

const CarbonPaper = () => {
  const [html, setHtml] = useState("");
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
                  padding: 20px;
                  color: #333;
                  background-color: white;
                  line-height: 1.6;
                  width: 100%;
                  max-width: 100%;
                  margin: 0 auto;
                  min-height: 100vh;
                }
                body[contenteditable="true"] { outline: none; }
                h1 { color: #2c3e50; }
                @media (min-width: 640px) {
                  body {
                    padding: 40px;
                    max-width: 900px;
                  }
                }
                @media print {
                  body {
                    size: 8.5in 11in;
                    margin: 1in;
                  }
                }
                @page {
                  size: 8.5in 11in;
                  margin: 1in;
                }
                .page-break {
                  page-break-before: always;
                }
              </style>
            </head>
            <body contenteditable="true"></body>
          </html>
        `);
        doc.close();
        attachIframeListeners(doc);
        doc.body.innerHTML =
          html ||
          "<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>";
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
    doc.body.addEventListener("input", updateHtml);
    doc.body.addEventListener("blur", updateHtml);
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
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "exported.html";
    a.click();
    URL.revokeObjectURL(url);
  };

  const execCommand = (command: string, value: string = "") => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand(command, false, value);
        setHtml(doc.body.innerHTML);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-4 flex flex-col sm:flex-row justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800 mb-4 sm:mb-0">CarbonPaper</h1>
        <div className="flex space-x-2 sm:space-x-4">
          <Button
            onClick={handleImport}
            variant="outline"
            className="bg-white hover:bg-gray-100"
          >
            Import
          </Button>
          <Button
            onClick={handleExport}
            variant="outline"
            className="bg-white hover:bg-gray-100"
          >
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
      <div className="bg-white shadow-sm p-2 flex flex-wrap gap-2">
        <Select onValueChange={(value) => execCommand("fontName", value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Font" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Courier">Courier</SelectItem>
          </SelectContent>
        </Select>

        <Select onValueChange={(value) => execCommand("fontSize", value)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select Font Size" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7].map((size) => (
              <SelectItem key={size} value={size.toString()}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => execCommand("bold")} variant="outline">
            B
          </Button>
          <Button onClick={() => execCommand("italic")} variant="outline">
            I
          </Button>
          <Button onClick={() => execCommand("underline")} variant="outline">
            U
          </Button>
          <Button onClick={() => execCommand("indent")} variant="outline">
            →
          </Button>
          <Button onClick={() => execCommand("outdent")} variant="outline">
            ←
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Color</Button>
            </PopoverTrigger>
            <PopoverContent className="w-40">
              {[
                "red",
                "blue",
                "green",
                "yellow",
                "purple",
                "orange",
                "black",
              ].map((color) => (
                <Button
                  key={color}
                  className="w-6 h-6 m-1"
                  style={{ backgroundColor: color }}
                  onClick={() => execCommand("foreColor", color)}
                />
              ))}
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <main className="flex-grow p-2 sm:p-6 flex justify-center overflow-auto">
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
