// File: components/Editor/Toolbar.tsx
import React from "react";
import { Select, SelectTrigger, SelectValue, SelectItem, SelectContent } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Indent, Outdent, Table, Type, ChevronDown, X } from "lucide-react";
import { ToolbarButton } from "./ToolbarButton";
import { ColorButton } from "./ColorButton";

interface ToolbarProps {
  currentFont: string;
  setCurrentFont: (font: string) => void;
  currentSize: string;
  setCurrentSize: (size: string) => void;
  currentColor: string;
  setCurrentColor: (color: string) => void;
  currentHighlight: string;
  setCurrentHighlight: (color: string) => void;
  colorOpen: boolean;
  setColorOpen: (open: boolean) => void;
  highlightOpen: boolean;
  setHighlightOpen: (open: boolean) => void;
  isBold: boolean;
  isItalic: boolean;
  isUnderline: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  applyFormatting: (command: string, value?: string) => void;
  clearFormatting: () => void;
  refocusEditor: () => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentFont,
  setCurrentFont,
  currentSize,
  setCurrentSize,
  currentColor,
  setCurrentColor,
  currentHighlight,
  setCurrentHighlight,
  colorOpen,
  setColorOpen,
  highlightOpen,
  setHighlightOpen,
  isBold,
  isItalic,
  isUnderline,
  textAlign,
  applyFormatting,
  clearFormatting,
  refocusEditor,
}) => {
  const handleSelectChange = (command: string, value: string) => {
    applyFormatting(command, value);
    refocusEditor();
  };

  const handleButtonClick = (command: string, value?: string) => {
    applyFormatting(command, value);
    refocusEditor();
  };

  const handleFontSizeChange = (size: string) => {
    const numericSize = parseInt(size, 10);
    handleSelectChange("fontSize", numericSize.toString());
    setCurrentSize(numericSize.toString());
  };

  return (
    <div className="bg-white shadow-sm p-2 flex flex-wrap items-center gap-1 sm:gap-2">
      <Select value={currentFont} onValueChange={(value) => handleSelectChange("fontName", value)}>
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

      <Select value={currentSize} onValueChange={handleFontSizeChange}>
        <SelectTrigger className="w-[60px] h-8">
          <SelectValue>{currentSize}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {[8, 10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72].map((size) => (
            <SelectItem key={size} value={size.toString()}>{size}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => handleButtonClick("bold")} icon={<Bold className="h-4 w-4" />} tooltip="Bold" active={isBold} />
      <ToolbarButton onClick={() => handleButtonClick("italic")} icon={<Italic className="h-4 w-4" />} tooltip="Italic" active={isItalic} />
      <ToolbarButton onClick={() => handleButtonClick("underline")} icon={<Underline className="h-4 w-4" />} tooltip="Underline" active={isUnderline} />

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
              <ColorButton key={color} color={color} onClick={(color) => { handleButtonClick("foreColor", color); setColorOpen(false); }} />
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
              <ColorButton key={color} color={color} onClick={(color) => { handleButtonClick("hiliteColor", color); setHighlightOpen(false); }} />
            ))}
            <Button
              className="w-6 h-6 p-0 rounded-sm flex items-center justify-center"
              onClick={() => { handleButtonClick('hiliteColor', 'transparent'); setHighlightOpen(false); }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <div className="h-6 w-px bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => handleButtonClick("justifyLeft")} icon={<AlignLeft className="h-4 w-4" />} tooltip="Align Left" active={textAlign === 'left'} />
      <ToolbarButton onClick={() => handleButtonClick("justifyCenter")} icon={<AlignCenter className="h-4 w-4" />} tooltip="Align Center" active={textAlign === 'center'} />
      <ToolbarButton onClick={() => handleButtonClick("justifyRight")} icon={<AlignRight className="h-4 w-4" />} tooltip="Align Right" active={textAlign === 'right'} />
      <ToolbarButton onClick={() => handleButtonClick("justifyFull")} icon={<AlignJustify className="h-4 w-4" />} tooltip="Justify" active={textAlign === 'justify'} />

      <div className="h-6 w-px bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => handleButtonClick("insertUnorderedList")} icon={<List className="h-4 w-4" />} tooltip="Bullet List" />
      <ToolbarButton onClick={() => handleButtonClick("insertOrderedList")} icon={<ListOrdered className="h-4 w-4" />} tooltip="Numbered List" />
      <ToolbarButton onClick={() => handleButtonClick("indent")} icon={<Indent className="h-4 w-4" />} tooltip="Increase Indent" />
      <ToolbarButton onClick={() => handleButtonClick("outdent")} icon={<Outdent className="h-4 w-4" />} tooltip="Decrease Indent" />

      <div className="h-6 w-px bg-gray-300 mx-1" />

      <ToolbarButton
        onClick={() => handleButtonClick("insertHTML", "<table border='1'><tr><td>Cell 1</td><td>Cell 2</td></tr><tr><td>Cell 3</td><td>Cell 4</td></tr></table>")}
        icon={<Table className="h-4 w-4" />}
        tooltip="Insert Table"
      />

      <div className="h-6 w-px bg-gray-300 mx-1" />

      <ToolbarButton onClick={() => { clearFormatting(); refocusEditor(); }} icon={<X className="h-4 w-4" />} tooltip="Clear Formatting" />
    </div>
  );
};

export default Toolbar;