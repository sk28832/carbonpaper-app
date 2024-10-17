"use client";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectContent,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Table,
  Type,
  FileInput,
  FileOutput,
  ChevronDown,
  X,
} from "lucide-react";

const CarbonPaper = () => {
  const [html, setHtml] = useState("");
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("3");
  const [currentColor, setCurrentColor] = useState("black");
  const [currentHighlight, setCurrentHighlight] = useState("yellow");
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);
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

  const applyFormatting = (command: string, value: string = "") => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand('styleWithCSS', false, 'true');
        doc.execCommand(command, false, value);
        setHtml(doc.body.innerHTML);

        // Update current styles
        const selection = doc.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const span = doc.createElement('span');
          range.surroundContents(span);
          
          if (command === 'fontName') {
            setCurrentFont(window.getComputedStyle(span).fontFamily.split(',')[0].replace(/['"]+/g, ''));
          } else if (command === 'fontSize') {
            setCurrentSize(value);
          } else if (command === 'foreColor') {
            setCurrentColor(value);
          } else if (command === 'hiliteColor') {
            setCurrentHighlight(value === 'transparent' ? 'none' : value);
          }

          range.extractContents();
          range.insertNode(span.firstChild!);
        }

        // Restore focus to the iframe
        iframeRef.current.focus();
        doc.body.focus();
      }
    }
  };

  const clearFormatting = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand('removeFormat', false, '');
        setHtml(doc.body.innerHTML);
        setCurrentFont('Arial');
        setCurrentSize('3');
        setCurrentColor('black');
        setCurrentHighlight('none');
        
        // Restore focus to the iframe
        iframeRef.current.focus();
        doc.body.focus();
      }
    }
  };

  const ToolbarButton = ({ onClick, icon, tooltip, active = false }: { onClick: () => void, icon: React.ReactNode, tooltip: string, active?: boolean }) => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            onClick={onClick} 
            variant={active ? "default" : "ghost"} 
            size="icon" 
            className="h-8 w-8"
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  const ColorButton = ({ color, isHighlight = false }: { color: string, isHighlight?: boolean }) => (
    <Button
      className="w-6 h-6 p-0 rounded-sm"
      style={{ backgroundColor: color }}
      onClick={() => {
        applyFormatting(isHighlight ? 'hiliteColor' : 'foreColor', color);
        isHighlight ? setHighlightOpen(false) : setColorOpen(false);
      }}
    />
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-white shadow-sm p-2 flex justify-between items-center">
        <h1 className="text-xl font-semibold text-gray-800">CarbonPaper</h1>
        <div className="flex space-x-2">
          <ToolbarButton onClick={handleImport} icon={<FileInput className="h-4 w-4" />} tooltip="Import" />
          <ToolbarButton onClick={handleExport} icon={<FileOutput className="h-4 w-4" />} tooltip="Export" />
          <Input
            type="file"
            ref={fileInputRef}
            accept=".html"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </header>
      <div className="bg-white shadow-sm p-2 flex flex-wrap items-center gap-1 sm:gap-2">
        <Select value={currentFont} onValueChange={(value) => applyFormatting("fontName", value)}>
          <SelectTrigger className="w-[120px] h-8">
            <SelectValue>{currentFont}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Arial">Arial</SelectItem>
            <SelectItem value="Helvetica">Helvetica</SelectItem>
            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
            <SelectItem value="Courier">Courier</SelectItem>
          </SelectContent>
        </Select>

        <Select value={currentSize} onValueChange={(value) => applyFormatting("fontSize", value)}>
          <SelectTrigger className="w-[60px] h-8">
            <SelectValue>{currentSize}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6, 7].map((size) => (
              <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => applyFormatting("bold")} icon={<Bold className="h-4 w-4" />} tooltip="Bold" />
        <ToolbarButton onClick={() => applyFormatting("italic")} icon={<Italic className="h-4 w-4" />} tooltip="Italic" />
        <ToolbarButton onClick={() => applyFormatting("underline")} icon={<Underline className="h-4 w-4" />} tooltip="Underline" />

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <Popover open={colorOpen} onOpenChange={setColorOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 flex items-center">
              <div className="w-4 h-4 mr-1" style={{ backgroundColor: currentColor }} />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="grid grid-cols-5 gap-1">
              {["black", "red", "blue", "green", "yellow", "purple", "orange", "white"].map((color) => (
                <ColorButton key={color} color={color} />
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover open={highlightOpen} onOpenChange={setHighlightOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 px-2 flex items-center">
              <Type className="h-4 w-4 mr-1" style={{ backgroundColor: currentHighlight !== 'none' ? currentHighlight : 'transparent' }} />
              <ChevronDown className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2">
            <div className="grid grid-cols-5 gap-1">
              {["yellow", "lime", "cyan", "magenta", "gray"].map((color) => (
                <ColorButton key={color} color={color} isHighlight />
              ))}
              <Button
                className="w-6 h-6 p-0 rounded-sm flex items-center justify-center"
                onClick={() => {
                  applyFormatting('hiliteColor', 'transparent');
                  setHighlightOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => applyFormatting("justifyLeft")} icon={<AlignLeft className="h-4 w-4" />} tooltip="Align Left" />
        <ToolbarButton onClick={() => applyFormatting("justifyCenter")} icon={<AlignCenter className="h-4 w-4" />} tooltip="Align Center" />
        <ToolbarButton onClick={() => applyFormatting("justifyRight")} icon={<AlignRight className="h-4 w-4" />} tooltip="Align Right" />
        <ToolbarButton onClick={() => applyFormatting("justifyFull")} icon={<AlignJustify className="h-4 w-4" />} tooltip="Justify" />

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <ToolbarButton onClick={() => applyFormatting("insertUnorderedList")} icon={<List className="h-4 w-4" />} tooltip="Bullet List" />
        <ToolbarButton onClick={() => applyFormatting("insertOrderedList")} icon={<ListOrdered className="h-4 w-4" />} tooltip="Numbered List" />
        <ToolbarButton onClick={() => applyFormatting("indent")} icon={<Indent className="h-4 w-4" />} tooltip="Increase Indent" />
        <ToolbarButton onClick={() => applyFormatting("outdent")} icon={<Outdent className="h-4 w-4" />} tooltip="Decrease Indent" />

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <ToolbarButton
          onClick={() => applyFormatting("insertHTML", "<table border='1'><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>")}
          icon={<Table className="h-4 w-4" />}
          tooltip="Insert Table"
        />

        <div className="h-6 w-px bg-gray-300 mx-1" />

        <ToolbarButton onClick={clearFormatting} icon={<X className="h-4 w-4" />} tooltip="Clear Formatting" />
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