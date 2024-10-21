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
  const conversationHistory = JSON.parse(
    formData.get("conversationHistory") as string
  ) as Message[];
  const selectedSources = JSON.parse(
    formData.get("selectedSources") as string
  ) as string[];
  const trackedChanges = formData.get("trackedChanges")
    ? (JSON.parse(formData.get("trackedChanges") as string) as TrackedChanges)
    : null;

  if (!input || !inputMode) {
    return NextResponse.json(
      { error: "Invalid request format" },
      { status: 400 }
    );
  }

  let referenceContent = "";
  const files = formData.getAll("files") as File[];
  for (const file of files) {
    const fileContent = await file.text();
    referenceContent += "\n" + fileContent;
  }

  try {
    let response;
    switch (inputMode) {
      case "question":
        response = await handleQuestionMode(
          input,
          editorContent,
          referenceContent,
          conversationHistory,
          selectedSources
        );
        break;
      case "edit":
        response = await handleEditMode(
          input,
          editorContent,
          referenceContent,
          trackedChanges
        );
        break;
      default:
        return NextResponse.json(
          { error: "Invalid input mode" },
          { status: 400 }
        );
    }

    return NextResponse.json(response);
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
  referenceContent: string,
  conversationHistory: Message[],
  selectedSources: string[]
) {
  const { content, citations } = await performRAG(
    input,
    selectedSources,
    editorContent
  );

  const assistantReply = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in law practices, regulations, and related topics. Your primary users are attorneys. Adhere to these guidelines:

        1. Provide concise, accurate answers based on the document content, your understanding of various legal practices, and the additional context provided.
        2. Prioritize information from the selected sources when answering questions.
        3. Use the knowledge base context to inform your answers, but do not explicitly reference it.
        4. Keep answers brief and to the point. Typically, one or two paragraphs should suffice.
        5. Use Markdown for formatting, but use it sparingly. Bold only key terms or figures.
        6. Do not use headers or lengthy explanations unless specifically requested.
        7. Never mention "context" or reference sources outside the provided information.
        8. If more information is needed, wait for the user to ask follow-up questions.
        9. Assume the user is somewhat knowledgeable about law; avoid explaining basic concepts.

        Main Document Content:
        ${editorContent}

        Reference Document Content:
        ${referenceContent}

        Additional Context:
        ${content}`,
      },
      ...conversationHistory,
      { role: "user", content: input },
    ],
    maxTokens: 2000,
  });

  return {
    type: "question",
    reply: assistantReply.text,
    citations,
  };
}

async function handleEditMode(
  input: string,
  editorContent: string,
  referenceContent: string,
  existingTrackedChanges: TrackedChanges | null
) {
  const response = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in editing and suggesting changes to legal documents. Your task is to analyze the user's input and suggest appropriate changes or additions to the document. Follow these guidelines:

        1. Analyze the given command and identify the specific change or addition requested.
        2. Use the reference document content to inform your suggestions, but only apply changes to the main document content.
        3. If there are existing tracked changes, consider them in your analysis and suggest further modifications if necessary.
        4. Instead of rewriting the entire document, provide specific changes to be made.
        5. Return the results in a structured JSON format that can be easily parsed.
        6. Include the original text to be replaced and the suggested replacement.
        7. Do not wrap the JSON response in Markdown code blocks or any other formatting.

        Example response format:
        {
          "trackedChanges": {
            "original": "Text to be replaced",
            "suggested": "Suggested replacement text"
          }
        }`,
      },
      {
        role: "user",
        content: `Main Document content: ${editorContent}\n\nReference Document content: ${referenceContent}\n\nExisting Tracked Changes: ${JSON.stringify(
          existingTrackedChanges
        )}\n\nCommand: ${input}`,
      },
    ],
    maxTokens: 4000,
  });

  let contentString = response.text;
  if (!contentString) {
    throw new Error("No content in AI response");
  }

  console.log("Raw AI response:", contentString); // For debugging

  // Remove Markdown code block syntax if present
  contentString = contentString.replace(/^```json\n?|\n?```$/g, '');

  let parsedContent;
  try {
    parsedContent = JSON.parse(contentString);
  } catch (error) {
    console.error("Error parsing AI response:", error);
    console.error("Processed AI response:", contentString);
    throw new Error("Invalid response format from AI");
  }

  if (!parsedContent.trackedChanges || !parsedContent.trackedChanges.original || !parsedContent.trackedChanges.suggested) {
    console.error("Unexpected response structure:", parsedContent);
    throw new Error("Unexpected response structure from AI");
  }

  let newTrackedChanges: TrackedChanges;
  if (existingTrackedChanges) {
    newTrackedChanges = {
      ...existingTrackedChanges,
      versions: [
        ...existingTrackedChanges.versions,
        parsedContent.trackedChanges.suggested
      ],
      currentVersionIndex: existingTrackedChanges.versions.length
    };
  } else {
    newTrackedChanges = {
      original: parsedContent.trackedChanges.original,
      versions: [parsedContent.trackedChanges.suggested],
      currentVersionIndex: 0
    };
  }

  return {
    type: "edit",
    trackedChanges: newTrackedChanges
  };
}

async function performRAG(
  query: string,
  selectedSources: string[],
  documentContent: string
): Promise<{ content: string; citations: string[] }> {
  // Implement RAG logic here
  // This would typically involve using a vector database and retrieval system
  // For now, we'll return a placeholder response
  const sourceContent = selectedSources
    .map((source) => `Content from ${source}`)
    .join("\n");
  return {
    content: `Additional context for query: "${query}"\n\nSelected sources:\n${sourceContent}\n\nDocument content:\n${documentContent}`,
    citations: selectedSources.map(
      (source) =>
        `https://example.com/${source.toLowerCase().replace(/\s+/g, "-")}`
    ),
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};
