// File: components/Editor/Editor.tsx
import React, { useRef, useEffect, useCallback, useState } from "react";
import Toolbar from "./Toolbar";
import HoveringFormatBar from "./HoveringFormatBar";
import { useEditorState } from "./useEditorState";
import { FileItem, TrackedChanges } from "@/types/fileTypes";

interface EditorProps {
  currentFile: FileItem;
  onContentChange: (content: string) => void;
  trackedChanges: TrackedChanges | null;
  onTrackedChangesUpdate: (trackedChanges: TrackedChanges | null) => void;
  onQuickAction: (selectedText: string, action: string) => Promise<void>;
  onCustomAction: (
    selectedText: string,
    action: string,
    isEdit: boolean
  ) => Promise<void>;
}

const Editor: React.FC<EditorProps> = ({
  currentFile,
  onContentChange,
  trackedChanges,
  onTrackedChangesUpdate,
  onQuickAction,
  onCustomAction,
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
    isBold,
    setIsBold,
    isItalic,
    setIsItalic,
    isUnderline,
    setIsUnderline,
    textAlign,
    setTextAlign,
  } = useEditorState();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const isInitializedRef = useRef(false);
  const [hoveringBarPosition, setHoveringBarPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    setHtml(currentFile.content);
  }, [currentFile.id, currentFile.content, setHtml]);

  useEffect(() => {
    if (trackedChanges) {
      applyTrackedChangesToEditor();
    }
  }, [trackedChanges]);

  const initializeIframe = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body {
                  font-family: 'Calibri', sans-serif;
                  font-size: 11pt;
                  line-height: 1.15;
                  background-color: #f0f0f0;
                  margin: 0;
                  padding: 0;
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  min-height: 100vh;
                }
                #editor-container {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 0.5in 0;
                  box-sizing: border-box;
                  min-height: 100vh;
                }
                #editor-content {
                  background-color: white;
                  width: 8.5in;
                  min-height: 11in;
                  padding: 1in;
                  margin-bottom: 0.5in;
                  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
                  box-sizing: border-box;
                  overflow-wrap: break-word;
                  word-wrap: break-word;
                  word-break: break-word;
                }
                .tracked-change {
                  background-color: #ffff00;
                }
                @media print {
                  body {
                    background-color: white;
                  }
                  #editor-container {
                    padding: 0;
                  }
                  #editor-content {
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    margin: 0;
                    padding: 0;
                    box-shadow: none;
                  }
                }
              </style>
            </head>
            <body>
              <div id="editor-container">
                <div id="editor-content" contenteditable="true"></div>
              </div>
            </body>
          </html>
        `);
        doc.close();
        attachIframeListeners(doc);
        doc.getElementById("editor-content")!.innerHTML = html || "";
      }
    }
  }, [html]);

  const updateIframeContent = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc && doc.getElementById("editor-content")!.innerHTML !== html) {
        doc.getElementById("editor-content")!.innerHTML = html;
      }
    }
  }, [html]);

  const attachIframeListeners = useCallback(
    (doc: Document) => {
      const updateHtml = () => {
        const content = doc.getElementById("editor-content")!.innerHTML;
        if (content !== html) {
          setHtml(content);
          onContentChange(content);
        }
      };

      const updateFormatting = () => {
        const selection = doc.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          const parentElement =
            range.commonAncestorContainer.nodeType === Node.TEXT_NODE
              ? range.commonAncestorContainer.parentElement
              : (range.commonAncestorContainer as HTMLElement);

          if (parentElement) {
            const computedStyle = window.getComputedStyle(parentElement);
            setCurrentFont(
              computedStyle.fontFamily.split(",")[0].replace(/['"]+/g, "")
            );
            setCurrentSize(
              Math.round(parseFloat(computedStyle.fontSize)).toString()
            );
            setIsBold(
              computedStyle.fontWeight === "bold" ||
                parseInt(computedStyle.fontWeight) >= 700
            );
            setIsItalic(computedStyle.fontStyle === "italic");
            setIsUnderline(computedStyle.textDecoration.includes("underline"));
            setTextAlign(
              computedStyle.textAlign as "left" | "center" | "right" | "justify"
            );
          }
        }
      };

      doc
        .getElementById("editor-content")!
        .addEventListener("input", updateHtml);
      doc.addEventListener("selectionchange", updateFormatting);
      doc.addEventListener("mousedown", () => setIsSelecting(true));
      doc.addEventListener("mouseup", () => {
        setIsSelecting(false);
        handleSelectionChange();
      });
    },
    [
      html,
      setHtml,
      setCurrentFont,
      setCurrentSize,
      setIsBold,
      setIsItalic,
      setIsUnderline,
      setTextAlign,
      onContentChange,
    ]
  );

  const applyFormatting = useCallback(
    (command: string, value: string = "") => {
      if (iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          doc.execCommand("styleWithCSS", false, "true");

          if (command === "fontSize") {
            doc.execCommand(
              command,
              false,
              (parseInt(value, 10) / 16).toString()
            );
          } else {
            doc.execCommand(command, false, value);
          }

          const newContent = doc.getElementById("editor-content")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);

          updateFormattingState(doc);

          iframeRef.current.focus();
          doc.getElementById("editor-content")!.focus();
        }
      }
    },
    [setHtml, onContentChange]
  );

  const handleQuickAction = useCallback(
    async (action: string) => {
      if (iframeRef.current && selectedText) {
        try {
          await onQuickAction(selectedText, action);
          // The trackedChanges will be updated by the parent component
        } catch (error) {
          console.error("Error applying quick action:", error);
        }
      }
    },
    [selectedText, onQuickAction]
  );

  const handleCustomAction = useCallback(
    async (action: string, isEdit: boolean) => {
      if (iframeRef.current && selectedText) {
        try {
          await onCustomAction(selectedText, action, isEdit);
          // The trackedChanges will be updated by the parent component
        } catch (error) {
          console.error("Error applying custom action:", error);
        }
      }
    },
    [selectedText, onCustomAction]
  );

  const handleAcceptChanges = useCallback(() => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const trackedChangeElements =
          doc.getElementsByClassName("tracked-change");
        if (trackedChangeElements.length > 0) {
          const element = trackedChangeElements[0];
          element.classList.remove("tracked-change");
        }

        const newContent = doc.getElementById("editor-content")!.innerHTML;
        setHtml(newContent);
        onContentChange(newContent);
        onTrackedChangesUpdate(null);
        setHoveringBarPosition(null);
      }
    }
  }, [trackedChanges, setHtml, onContentChange, onTrackedChangesUpdate]);

  const handleRejectChanges = useCallback(() => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const trackedChangeElements =
          doc.getElementsByClassName("tracked-change");
        if (trackedChangeElements.length > 0) {
          const element = trackedChangeElements[0];
          element.innerHTML = trackedChanges.original;
          element.classList.remove("tracked-change");
        }

        const newContent = doc.getElementById("editor-content")!.innerHTML;
        setHtml(newContent);
        onContentChange(newContent);
        onTrackedChangesUpdate(null);
        setHoveringBarPosition(null);
      }
    }
  }, [trackedChanges, setHtml, onContentChange, onTrackedChangesUpdate]);

  const handleNavigateVersion = useCallback(
    (direction: "prev" | "next") => {
      if (trackedChanges && iframeRef.current) {
        const doc = iframeRef.current.contentDocument;
        if (doc) {
          const newIndex =
            direction === "prev"
              ? Math.max(0, trackedChanges.currentVersionIndex - 1)
              : Math.min(
                  trackedChanges.versions.length - 1,
                  trackedChanges.currentVersionIndex + 1
                );

          const newTrackedChanges = {
            ...trackedChanges,
            currentVersionIndex: newIndex,
          };

          const trackedChangeElements =
            doc.getElementsByClassName("tracked-change");
          if (trackedChangeElements.length > 0) {
            const element = trackedChangeElements[0];
            element.innerHTML = newTrackedChanges.versions[newIndex];
          }

          const newContent = doc.getElementById("editor-content")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);
          onTrackedChangesUpdate(newTrackedChanges);
        }
      }
    },
    [trackedChanges, setHtml, onContentChange, onTrackedChangesUpdate]
  );

  const handleReprocessChanges = useCallback(async () => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        try {
          const currentVersion =
            trackedChanges.versions[trackedChanges.currentVersionIndex];
          await onQuickAction(currentVersion, "improve");
          // The trackedChanges will be updated by the parent component
        } catch (error) {
          console.error("Error reprocessing changes:", error);
        }
      }
    }
  }, [trackedChanges, onQuickAction]);

  const updateFormattingState = (doc: Document) => {
    const selection = doc.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const span = doc.createElement("span");
      range.surroundContents(span);

      const computedStyle = window.getComputedStyle(span);
      setCurrentFont(
        computedStyle.fontFamily.split(",")[0].replace(/['"]+/g, "")
      );
      setCurrentSize(Math.round(parseFloat(computedStyle.fontSize)).toString());
      setIsBold(
        computedStyle.fontWeight === "bold" ||
          parseInt(computedStyle.fontWeight) >= 700
      );
      setIsItalic(computedStyle.fontStyle === "italic");
      setIsUnderline(computedStyle.textDecoration.includes("underline"));
      setTextAlign(
        computedStyle.textAlign as "left" | "center" | "right" | "justify"
      );

      range.extractContents();
      range.insertNode(span.firstChild!);
    }
  };

  const clearFormatting = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        doc.execCommand("removeFormat", false, "");
        const newContent = doc.getElementById("editor-content")!.innerHTML;
        setHtml(newContent);
        onContentChange(newContent);
        setCurrentFont("Calibri");
        setCurrentSize("11");
        setCurrentColor("black");
        setCurrentHighlight("none");
        setIsBold(false);
        setIsItalic(false);
        setIsUnderline(false);
        setTextAlign("left");

        iframeRef.current.focus();
        doc.getElementById("editor-content")!.focus();
      }
    }
  }, [
    setHtml,
    setCurrentFont,
    setCurrentSize,
    setCurrentColor,
    setCurrentHighlight,
    setIsBold,
    setIsItalic,
    setIsUnderline,
    setTextAlign,
    onContentChange,
  ]);

  const refocusEditor = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        iframeRef.current.focus();
        doc.getElementById("editor-content")!.focus();
      }
    }
  }, []);

  const handleSelectionChange = useCallback(() => {
    if (iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const selection = doc.getSelection();
        if (selection && !selection.isCollapsed) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const iframeRect = iframeRef.current.getBoundingClientRect();

          setHoveringBarPosition({
            top: rect.bottom - iframeRect.top + 5, // Position below the selection
            left: rect.left - iframeRect.left + rect.width / 2,
          });
          setSelectedText(selection.toString());
        } else {
          setHoveringBarPosition(null);
          setSelectedText("");
        }
      }
    }
  }, []);

  const applyTrackedChangesToEditor = useCallback(() => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const content = doc.getElementById("editor-content")!.innerHTML;
        const updatedContent = content.replace(
          trackedChanges.original,
          `<span class="tracked-change">${
            trackedChanges.versions[trackedChanges.currentVersionIndex]
          }</span>`
        );
        doc.getElementById("editor-content")!.innerHTML = updatedContent;
        setHtml(updatedContent);
        onContentChange(updatedContent);
      }
    }
  }, [trackedChanges, setHtml, onContentChange]);

  useEffect(() => {
    if (!isInitializedRef.current) {
      initializeIframe();
      isInitializedRef.current = true;
    } else {
      updateIframeContent();
    }

    const currentIframe = iframeRef.current;
    if (currentIframe) {
      const doc = currentIframe.contentDocument;
      if (doc) {
        doc.addEventListener("selectionchange", handleSelectionChange);
      }
    }

    return () => {
      if (currentIframe) {
        const doc = currentIframe.contentDocument;
        if (doc) {
          doc.removeEventListener("selectionchange", handleSelectionChange);
        }
      }
    };
  }, [initializeIframe, updateIframeContent, handleSelectionChange]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="overflow-x-auto">
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
          isBold={isBold}
          isItalic={isItalic}
          isUnderline={isUnderline}
          textAlign={textAlign}
          applyFormatting={applyFormatting}
          clearFormatting={clearFormatting}
          refocusEditor={refocusEditor}
        />
      </div>
      <div className="flex-grow overflow-auto p-4 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border border-gray-200 rounded-lg shadow-sm focus:outline-none bg-white"
          title="CarbonPaper Editor"
          sandbox="allow-same-origin allow-scripts"
        />
        {!isSelecting && hoveringBarPosition && (
          <HoveringFormatBar
            onQuickAction={handleQuickAction}
            onCustomAction={handleCustomAction}
            position={hoveringBarPosition}
            trackedChanges={trackedChanges}
            onAcceptChanges={handleAcceptChanges}
            onRejectChanges={handleRejectChanges}
            onNavigateVersion={handleNavigateVersion}
            onReprocessChanges={handleReprocessChanges}
          />
        )}
      </div>
    </div>
  );
};

export default Editor;
