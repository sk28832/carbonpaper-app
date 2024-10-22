// File: components/Editor/Editor.tsx
import React, { useRef, useEffect, useCallback, useState } from "react";
import Toolbar from "./Toolbar";
import HoveringFormatBar from "./HoveringFormatBar";
import { useEditorState } from "./useEditorState";
import { FileItem, TrackedChanges } from "@/types/fileTypes";

interface SelectionInfo {
  elementId: string;
  startOffset: number;
  endOffset: number;
  parentElement: HTMLElement;
  originalText: string;
}

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
  const [activeSelection, setActiveSelection] = useState<SelectionInfo | null>(null);
  const [hoveringBarPosition, setHoveringBarPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [isSelecting, setIsSelecting] = useState(false);

  // Get iframe styles including tracked changes styling
  const getIframeStyles = () => `
    .tracked-change {
      background-color: #ffff00;
      transition: background-color 0.3s ease;
    }
    .tracked-change:hover {
      background-color: #ffeb3b;
    }
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
    @media print {
      body { background-color: white; }
      #editor-container { padding: 0; }
      #editor-content {
        width: 100%;
        height: 100%;
        min-height: 0;
        margin: 0;
        padding: 0;
        box-shadow: none;
      }
    }
  `;

  const getSelectionInfo = (selection: Selection): SelectionInfo | null => {
    if (!selection.rangeCount) return null;
    
    const range = selection.getRangeAt(0);
    const elementId = `sel-${Date.now()}`;
    const span = document.createElement('span');
    span.id = elementId;
    
    try {
      range.surroundContents(span);
      
      return {
        elementId,
        startOffset: range.startOffset,
        endOffset: range.endOffset,
        parentElement: span.parentElement as HTMLElement,
        originalText: span.textContent || ''
      };
    } catch (error) {
      console.error('Error creating selection info:', error);
      return null;
    }
  };

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
              <style>${getIframeStyles()}</style>
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
            top: rect.bottom - iframeRect.top + 5,
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
      handleSelectionChange,
    ]
  );

  const handleQuickAction = useCallback(
    async (action: string) => {
      if (iframeRef.current && selectedText) {
        try {
          const doc = iframeRef.current.contentDocument;
          if (!doc) return;

          const selection = doc.getSelection();
          if (!selection || !selection.rangeCount) return;

          // Get and store selection info before making any changes
          const selectionInfo = getSelectionInfo(selection);
          if (!selectionInfo) return;
          
          setActiveSelection(selectionInfo);

          // Create a temporary marker and immediately highlight it
          const element = doc.getElementById(selectionInfo.elementId);
          if (element) {
            element.className = 'tracked-change';
          }

          // Update editor to show the selection is being processed
          const newContent = doc.getElementById("editor-content")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);

          // Call the quick action with the original selected text
          await onQuickAction(selectedText, action);
        } catch (error) {
          console.error("Error applying quick action:", error);
          // Clean up on error
          setActiveSelection(null);
        }
      }
    },
    [selectedText, onQuickAction, setHtml, onContentChange]
  );

  const handleCustomAction = useCallback(
    async (action: string, isEdit: boolean) => {
      if (iframeRef.current && selectedText) {
        try {
          const doc = iframeRef.current.contentDocument;
          if (!doc) return;

          const selection = doc.getSelection();
          if (!selection || !selection.rangeCount) return;

          if (isEdit) {
            // Get and store selection info before making any changes
            const selectionInfo = getSelectionInfo(selection);
            if (!selectionInfo) return;
            
            setActiveSelection(selectionInfo);

            // Create a temporary marker and immediately highlight it
            const element = doc.getElementById(selectionInfo.elementId);
            if (element) {
              element.className = 'tracked-change';
            }

            // Update editor to show selection is being processed
            const newContent = doc.getElementById("editor-content")!.innerHTML;
            setHtml(newContent);
            onContentChange(newContent);
          }
          
          // Call the custom action
          await onCustomAction(selectedText, action, isEdit);
        } catch (error) {
          console.error("Error applying custom action:", error);
          setActiveSelection(null);
        }
      }
    },
    [selectedText, onCustomAction, setHtml, onContentChange]
  );

  const applyTrackedChangesToEditor = useCallback(() => {
    if (!trackedChanges || !iframeRef.current) return;

    const doc = iframeRef.current.contentDocument;
    if (!doc) return;

    // If we don't have an elementId in tracked changes, use the active selection
    if (!trackedChanges.elementId && activeSelection) {
      const newTrackedChanges = {
        ...trackedChanges,
        elementId: activeSelection.elementId
      };
      onTrackedChangesUpdate(newTrackedChanges);
      return;
    }

    const elementId = trackedChanges.elementId || activeSelection?.elementId;
    if (!elementId) return;

    // Try to find the element we're supposed to modify
    const element = doc.getElementById(elementId);
    if (!element) {
      // If we can't find the element but have active selection info,
      // try to reestablish the selection context
      if (activeSelection) {
        const newSpan = doc.createElement('span');
        newSpan.id = elementId;
        newSpan.className = 'tracked-change';
        newSpan.innerHTML = trackedChanges.versions[trackedChanges.currentVersionIndex];
        
        const content = doc.getElementById("editor-content")!.innerHTML;
        const escapedOriginal = trackedChanges.original
          .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          .replace(/\s+/g, '\\s+');
        
        const regex = new RegExp(`(${escapedOriginal})`, 'g');
        const updatedContent = content.replace(regex, `<span id="${elementId}" class="tracked-change">${trackedChanges.versions[trackedChanges.currentVersionIndex]}</span>`);
        
        if (content !== updatedContent) {
          doc.getElementById("editor-content")!.innerHTML = updatedContent;
        }
      }
    } else {
      // Update existing element
      element.innerHTML = trackedChanges.versions[trackedChanges.currentVersionIndex];
    }

    // Update the editor content
    const finalContent = doc.getElementById("editor-content")!.innerHTML;
    setHtml(finalContent);
    onContentChange(finalContent);

    // Scroll the change into view
    const finalElement = doc.getElementById(elementId);
    if (finalElement) {
      setTimeout(() => {
        finalElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }

    // Clear active selection after applying changes
    setActiveSelection(null);
  }, [trackedChanges, activeSelection, onTrackedChangesUpdate, setHtml, onContentChange]);

  const handleAcceptChanges = useCallback(() => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const element = doc.getElementById(trackedChanges.elementId || "") as HTMLElement | null;
        if (element) {
          // Keep the content but remove the tracked-change class and ID
          element.classList.remove("tracked-change");
          element.removeAttribute("id");
          
          const newContent = doc.getElementById("editor-content")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);
          onTrackedChangesUpdate(null);
          setHoveringBarPosition(null);
        }
      }
    }
  }, [trackedChanges, setHtml, onContentChange, onTrackedChangesUpdate]);

  const handleRejectChanges = useCallback(() => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc) {
        const element = doc.getElementById(trackedChanges.elementId || "") as HTMLElement | null;
        if (element) {
          // Replace the element with the original text
          const textNode = doc.createTextNode(trackedChanges.original);
          element.parentNode?.replaceChild(textNode, element);
          
          const newContent = doc.getElementById("editor-content")!.innerHTML;
          setHtml(newContent);
          onContentChange(newContent);
          onTrackedChangesUpdate(null);
          setHoveringBarPosition(null);
        }
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

          const element = doc.getElementById(trackedChanges.elementId || "") as HTMLElement | null;
          if (element) {
            element.innerHTML = newTrackedChanges.versions[newIndex];
            
            const newContent = doc.getElementById("editor-content")!.innerHTML;
            setHtml(newContent);
            onContentChange(newContent);
            onTrackedChangesUpdate(newTrackedChanges);
          }
        }
      }
    },
    [trackedChanges, setHtml, onContentChange, onTrackedChangesUpdate]
  );

  const handleReprocessChanges = useCallback(async () => {
    if (trackedChanges && iframeRef.current) {
      const doc = iframeRef.current.contentDocument;
      if (doc && trackedChanges.elementId) {
        const element = doc.getElementById(trackedChanges.elementId);
        if (element) {
          try {
            const currentVersion = trackedChanges.versions[trackedChanges.currentVersionIndex];
            // Store the element position before reprocessing
            setActiveSelection({
              elementId: trackedChanges.elementId,
              startOffset: 0,
              endOffset: currentVersion.length,
              parentElement: element.parentElement as HTMLElement,
              originalText: currentVersion
            });
            await onQuickAction(currentVersion, "improve");
          } catch (error) {
            console.error("Error reprocessing changes:", error);
          }
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