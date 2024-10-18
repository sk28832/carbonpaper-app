// File: components/Editor/Editor.tsx
import React, { useRef, useEffect, useCallback } from "react";
import Toolbar from "./Toolbar";
import { useEditorState } from "./useEditorState";
import { FileItem } from "@/types/fileTypes";

interface EditorProps {
  currentFile: FileItem;
  onContentChange: (content: string) => void;
}

const Editor: React.FC<EditorProps> = ({
  currentFile,
  onContentChange,
}) => {
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
    setHtml(currentFile.content);
  }, [currentFile.id, currentFile.content]);

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
                  color: #333;
                  line-height: 1.6;
                  background-color: #e0e0e0;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                }
                .page {
                  background-color: white;
                  width: 8.5in;
                  min-height: 11in;
                  padding: 1in;
                  margin: 0.5in 0;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  box-sizing: border-box;
                }
                .page:not(:last-child) {
                  margin-bottom: 0.5in;
                }
                @media print {
                  body {
                    background-color: white;
                  }
                  .page {
                    width: 100%;
                    min-height: auto;
                    box-shadow: none;
                    margin: 0;
                    padding: 0;
                  }
                }
                h1 { color: #2c3e50; }
              </style>
            </head>
            <body>
              <div class="page" contenteditable="true"></div>
            </body>
          </html>
        `);
        doc.close();
        attachIframeListeners(doc);
        doc.querySelector(".page")!.innerHTML = html || "";
      }
    }
  };

  const updateIframeContent = () => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc && doc.querySelector(".page")!.innerHTML !== html) {
        const selection = doc.getSelection();
        let range: Range | null = null;
        let startContainer: Node | null = null;
        let startOffset: number = 0;

        if (selection && selection.rangeCount > 0) {
          range = selection.getRangeAt(0);
          startContainer = range.startContainer;
          startOffset = range.startOffset;
        }

        doc.querySelector(".page")!.innerHTML = html;

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
      const content = doc.querySelector(".page")!.innerHTML;
      if (content !== html) {
        setHtml(content);
        onContentChange(content);
      }
    };
    doc.querySelector(".page")!.addEventListener("input", updateHtml);
  };

  const applyFormatting = useCallback(
    (command: string, value: string = "") => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.execCommand("styleWithCSS", false, "true");
          doc.execCommand(command, false, value);
          const newContent = doc.querySelector(".page")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);

          // Update current styles
          const selection = doc.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const span = doc.createElement("span");
            range.surroundContents(span);

            if (command === "fontName") {
              setCurrentFont(
                window
                  .getComputedStyle(span)
                  .fontFamily.split(",")[0]
                  .replace(/['"]+/g, "")
              );
            } else if (command === "fontSize") {
              setCurrentSize(value);
            } else if (command === "foreColor") {
              setCurrentColor(value);
            } else if (command === "hiliteColor") {
              setCurrentHighlight(value === "transparent" ? "none" : value);
            }

            range.extractContents();
            range.insertNode(span.firstChild!);
          }

          // Restore focus to the iframe
          iframeRef.current.focus();
          (doc.querySelector(".page") as HTMLElement).focus();
        }
      }
    },
    [
      setHtml,
      setCurrentFont,
      setCurrentSize,
      setCurrentColor,
      setCurrentHighlight,
      onContentChange,
    ]
  );

  const clearFormatting = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand("removeFormat", false, "");
        const newContent = doc.querySelector(".page")!.innerHTML;
        setHtml(newContent);
        onContentChange(newContent);
        setCurrentFont("Arial");
        setCurrentSize("3");
        setCurrentColor("black");
        setCurrentHighlight("none");

        // Restore focus to the iframe
        iframeRef.current.focus();
        (doc.querySelector(".page") as HTMLElement).focus();
      }
    }
  }, [
    setHtml,
    setCurrentFont,
    setCurrentSize,
    setCurrentColor,
    setCurrentHighlight,
    onContentChange,
  ]);

  const refocusEditor = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        iframeRef.current.focus();
        (doc.querySelector(".page") as HTMLElement).focus();
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full bg-gray-200">
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
      <div className="flex-grow overflow-auto">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-none focus:outline-none"
          title="CarbonPaper Editor"
          sandbox="allow-same-origin allow-scripts"
        />
      </div>
    </div>
  );
};

export default Editor;