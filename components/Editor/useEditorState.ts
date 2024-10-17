// File: components/Editor/useEditorState.ts
import { useState } from "react";

export const useEditorState = () => {
  const [html, setHtml] = useState("");
  const [currentFont, setCurrentFont] = useState("Arial");
  const [currentSize, setCurrentSize] = useState("3");
  const [currentColor, setCurrentColor] = useState("black");
  const [currentHighlight, setCurrentHighlight] = useState("yellow");
  const [colorOpen, setColorOpen] = useState(false);
  const [highlightOpen, setHighlightOpen] = useState(false);

  return {
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
  };
};