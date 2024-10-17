// File: components/Editor/Editor.tsx
import React, { useState, useRef, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";
import { useEditorState } from "./useEditorState";

interface EditorProps {
  currentFile: string | null;
  initialContent: string;
  onContentChange: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({ currentFile, initialContent, onContentChange }) => {
  const {
    html,
    setHtml,
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
  } = useEditorState();

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

  useEffect(() => {
    setHtml(initialContent);
  }, [initialContent]);

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
        doc.body.innerHTML = html || "<h1>Welcome to CarbonPaper</h1><p>Start crafting your document...</p>";
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
        onContentChange(doc.body.innerHTML);
      }
    };
    doc.body.addEventListener("input", updateHtml);
    doc.body.addEventListener("blur", updateHtml);
  };

  const applyFormatting = useCallback((command: string, value: string = "") => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand('styleWithCSS', false, 'true');
        doc.execCommand(command, false, value);
        setHtml(doc.body.innerHTML);
        onContentChange(doc.body.innerHTML);

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
  }, [setHtml, setCurrentFont, setCurrentSize, setCurrentColor, setCurrentHighlight, onContentChange]);

  const clearFormatting = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand('removeFormat', false, '');
        setHtml(doc.body.innerHTML);
        onContentChange(doc.body.innerHTML);
        setCurrentFont('Arial');
        setCurrentSize('3');
        setCurrentColor('black');
        setCurrentHighlight('none');
        
        // Restore focus to the iframe
        iframeRef.current.focus();
        doc.body.focus();
      }
    }
  }, [setHtml, setCurrentFont, setCurrentSize, setCurrentColor, setCurrentHighlight, onContentChange]);

  const refocusEditor = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        iframeRef.current.focus();
        doc.body.focus();
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-white">
      <h2 className="text-xl font-semibold p-4 bg-gray-50 border-b border-gray-200">{currentFile || 'Untitled'}</h2>
      <Toolbar
        currentFont={currentFont}
        setCurrentFont={setCurrentFont}
        currentSize={currentSize}
        setCurrentSize={setCurrentSize}
        currentColor={currentColor}
        setCurrentColor={setCurrentColor}
        currentHighlight={currentHighlight}
        setCurrentHighlight={setCurrentHighlight}
        colorOpen={colorOpen}
        setColorOpen={setColorOpen}
        highlightOpen={highlightOpen}
        setHighlightOpen={setHighlightOpen}
        applyFormatting={applyFormatting}
        clearFormatting={clearFormatting}
        refocusEditor={refocusEditor}
      />
      <div className="flex-grow">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none"
          title="CarbonPaper Editor"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};

export default Editor;