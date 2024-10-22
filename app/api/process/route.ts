// app/api/process/route.ts

import { NextResponse } from "next/server";
import { generateText } from "ai";
import { Message, InputMode } from "@/types/chatTypes";
import { TrackedChanges } from "@/types/fileTypes";
import { openai } from "@/lib/openai";

export async function POST(request: Request) {
  const formData = await request.formData();
  const input = formData.get("input") as string;
  const editorContent = formData.get("editorContent") as string;
  const inputMode = formData.get("inputMode") as InputMode;
  const conversationHistory = formData.get("conversationHistory") 
    ? JSON.parse(formData.get("conversationHistory") as string) as Message[]
    : [];
  const selectedSources = formData.get("selectedSources")
    ? JSON.parse(formData.get("selectedSources") as string) as string[]
    : [];
  const trackedChanges = formData.get("trackedChanges")
    ? JSON.parse(formData.get("trackedChanges") as string) as TrackedChanges
    : null;
  const selectedText = formData.get("selectedText") as string | null;

  if (!input) {
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  try {
    if (selectedText) {
      // Handle hover bar actions (quick action or custom action)
      const response = await handleQuickAction(input, selectedText, inputMode === "edit");
      return NextResponse.json(response);
    } else {
      // Handle AI chat actions
      switch (inputMode) {
        case "question":
          const response = await handleQuestionMode(
            input,
            editorContent,
            conversationHistory,
            selectedSources
          );
          return NextResponse.json(response);
        case "edit":
          const editResponse = await handleEditMode(
            input,
            editorContent,
            trackedChanges
          );
          return NextResponse.json(editResponse);
        default:
          return NextResponse.json(
            { error: "Invalid input mode" },
            { status: 400 }
          );
      }
    }
  } catch (error) {
    console.error("Error in process endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

async function handleQuestionMode(
  input: string,
  editorContent: string,
  conversationHistory: Message[],
  selectedSources: string[]
) {
  // Build context from document content and selected sources
  const context = `
Document Content:
${editorContent}

${selectedSources.length > 0 ? `Additional Context from Selected Sources:
${selectedSources.join('\n')}` : ''}
`;

  const assistantReply = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in law practices, regulations, and related topics. Your primary users are attorneys. Provide concise, accurate answers to their questions. You have access to the full document content and any additional selected sources for context. Reference specific parts of the document when relevant to your answers.`,
      },
      {
        role: "user",
        content: `Context:
${context}

Question: ${input}`,
      },
      ...conversationHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ],
    maxTokens: 2000,
  });

  // Extract relevant citations from the document based on the response
  const citations = extractCitations(assistantReply.text, editorContent);

  return {
    type: "question",
    reply: assistantReply.text,
    citations
  };
}

async function handleEditMode(
  input: string,
  editorContent: string,
  existingTrackedChanges: TrackedChanges | null
) {
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in editing and suggesting changes to legal documents. Your task is to analyze the user's input and suggest appropriate changes to the document.`,
      },
      {
        role: "user",
        content: `Edit request: ${input}\n\nDocument content: ${editorContent}`,
      },
    ],
    maxTokens: 4000,
  });

  const trackedChanges: TrackedChanges = {
    original: editorContent,
    versions: [response.text],
    currentVersionIndex: 0,
  };

  return {
    type: "edit",
    trackedChanges,
  };
}

async function handleQuickAction(
  action: string,
  selectedText: string,
  isEdit: boolean
) {
  const promptMap: { [key: string]: string } = {
    improve: "Improve the following text while maintaining its original meaning:",
    fixGrammar: "Fix any grammatical errors in the following text:",
    shorter: "Make the following text more concise while maintaining its key points:",
    longer: "Expand on the following text to provide more detail:",
  };

  const prompt = promptMap[action] || action;

  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in improving legal text. Your task is to ${prompt.toLowerCase()}`,
      },
      {
        role: "user",
        content: selectedText,
      },
    ],
    maxTokens: 2000,
  });

  if (isEdit) {
    return {
      type: "edit",
      trackedChanges: {
        original: selectedText,
        versions: [response.text],
        currentVersionIndex: 0,
      },
    };
  } else {
    return {
      type: "question",
      reply: response.text,
      citations: [],
    };
  }
}

function extractCitations(reply: string, documentContent: string): string[] {
  // Simple citation extraction - can be enhanced based on needs
  const sentences = documentContent.split(/[.!?]+/);
  const citations = [];
  
  for (const sentence of sentences) {
    if (reply.toLowerCase().includes(sentence.toLowerCase().trim())) {
      citations.push(sentence.trim());
    }
  }
  
  return citations;
}

export const config = {
  api: {
    bodyParser: false,
  },
};