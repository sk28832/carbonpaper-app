import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { v4 as uuidv4 } from 'uuid';
import { Message, Change, InputMode } from '@/types/chatTypes';
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  const formData = await request.formData();
  const input = formData.get('input') as string;
  const editorContent = formData.get('editorContent') as string;
  const inputMode = formData.get('inputMode') as InputMode;
  const conversationHistory = JSON.parse(formData.get('conversationHistory') as string) as Message[];

  if (!input || !inputMode) {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  }

  let referenceContent = '';
  const files = formData.getAll('files') as File[];
  for (const file of files) {
    const fileContent = await file.text();
    referenceContent += '\n' + fileContent;
  }

  try {
    let response;
    switch (inputMode) {
      case 'question':
        response = await handleQuestionMode(input, editorContent, referenceContent, conversationHistory);
        break;
      case 'edit':
        response = await handleEditMode(input, editorContent, referenceContent);
        break;
      case 'draft':
        response = await handleDraftMode(input, editorContent, referenceContent);
        break;
      case 'research':
        const researchSource = formData.get('researchSource') as string;
        response = await handleResearchMode(input, researchSource);
        break;
      default:
        return NextResponse.json({ error: 'Invalid input mode' }, { status: 400 });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in process endpoint:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}

async function handleQuestionMode(input: string, editorContent: string, referenceContent: string, conversationHistory: Message[]) {
  const citation = await findCitation(input, editorContent);
  const assistantReply = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in law practices, regulations, and related topics. Your primary users are attorneys. Adhere to these guidelines:

        1. Provide concise, accurate answers based on the document content your understanding of various legal practices.
        2. Prioritize information from the document content when answering questions.
        3. Use the knowledge base context to inform your answers, but do not explicitly reference it.
        4. Keep answers brief and to the point. Typically, one or two sentences should suffice.
        5. Use Markdown for formatting, but use it sparingly. Bold only key terms or figures.
        6. Do not use headers or lengthy explanations unless specifically requested.
        7. Never mention "context" or reference sources outside the document.
        8. If more information is needed, wait for the user to ask follow-up questions.
        9. Assume the user is somewhat knowledgeable about law; avoid explaining basic concepts.

        Main Document Content:
        ${editorContent}

        Reference Document Content:
        ${referenceContent}`,
      },
      ...conversationHistory,
      { role: "user", content: input },
    ],
    maxTokens: 2000,
  });

  return {
    type: 'question',
    reply: assistantReply.text,
    citation,
  };
}

async function handleEditMode(input: string, editorContent: string, referenceContent: string) {
  const analysisResult = await analyzeDocument(editorContent, input, referenceContent);
  return { type: 'edit', ...analysisResult };
}

async function handleDraftMode(input: string, editorContent: string, referenceContent: string) {
  const draftedContent = await draftContent(input, editorContent, referenceContent);
  return { type: 'draft', draftContent: draftedContent };
}

async function handleResearchMode(input: string, researchSource: string) {
  const { content, citations } = await performRAG(input, researchSource);
  return { type: 'research', researchResult: content, citations };
}

async function findCitation(question: string, documentContent: string): Promise<string | null> {
  const response = await generateText({
    model: openai("gpt-4o-mini"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in analyzing legal documents. Your task is to find a specific citation in the document that answers the given question. Follow these guidelines strictly:

        1. Return ONLY the shortest, most essential phrase that directly answers the question. This should typically be 2-5 words.
        2. The returned text MUST be an exact, contiguous substring of the document content. Do not modify or rephrase the text in any way.
        3. Choose the most unique phrase possible to ensure it can be easily located in the document.
        4. If there are multiple occurrences of the phrase, choose the one most relevant to the question.
        5. If the question cannot be answered with a specific short phrase, return "No specific citation found."
        6. Do not add any quotation marks or additional formatting to the citation.
        7. Ensure the phrase is short enough that it's unlikely to be broken across lines in the document.

        Example:
        Question: "What is the management fee?"
        Bad Answer: "Through the end of the Investment Period, the Manager will receive an annual management fee equal to 2% of committed capital"
        Good Answer: "2% of committed capital"`,
      },
      {
        role: "user",
        content: `Question: ${question}\n\nDocument Content: ${documentContent}`,
      },
    ],
    maxTokens: 50,
  });

  const citation = response.text.trim() || "No specific citation found.";
  return citation === "No specific citation found." ? null : citation;
}

async function analyzeDocument(content: string, command: string, referenceContent: string): Promise<{ changes: Change[], updatedContent: string }> {
  const response = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in analyzing and suggesting changes to legal documents. Your task is to identify all instances where the requested change should be applied and provide the necessary information for each change. Follow these guidelines:

        1. Analyze the given command and identify the specific change requested.
        2. Use the reference document content to inform your suggestions, but only apply changes to the main document content.
        3. Search the entire main document content for all instances where this change should be applied.
        4. For each instance, provide the following information:
           - Description of the change (brief)
           - Original text (only the exact part that needs to change, typically 5-10 words)
           - Suggested text (only the replacement for the original text, keeping it as brief as possible)
        5. Ensure that the suggested changes are precise and can be easily found in the main document.
        6. Return the results in a structured JSON format that can be easily parsed.
        7. Do not include any markdown formatting, code block indicators, or language identifiers in your response.
        8. Ensure your response is valid JSON that can be parsed directly.
        9. Include the full updated content of the document after applying all changes.

        Example command: "Change management fee to 1.5%"
        Example response:
        {"changes":[{"description":"Update management fee","originalText":"2% of committed capital","suggestedText":"1.5% of committed capital"}],"updatedContent":"... the Manager will receive an annual management fee equal to 1.5% of committed capital ..."}`,
      },
      {
        role: "user",
        content: `Main Document content: ${content}\n\nReference Document content: ${referenceContent}\n\nCommand: ${command}`,
      },
    ],
    maxTokens: 4000,
  });

  const contentString = response.text;
  if (!contentString) {
    throw new Error("No content in AI response");
  }

  const parsedContent = JSON.parse(contentString);
  parsedContent.changes = parsedContent.changes.map((change: Omit<Change, 'id' | 'status'>) => ({
    ...change,
    id: uuidv4(),
    status: 'pending',
  }));

  return parsedContent;
}

async function draftContent(input: string, documentContent: string, referenceContent: string): Promise<string> {
  const response = await generateText({
    model: openai("gpt-4o"),
    messages: [
      {
        role: "system",
        content: `You are an AI assistant specialized in drafting legal documents. Your task is to generate new content based on the user's request. Follow these guidelines:

        1. Generate only the body content of the clause or section, without any headers or section numbers.
        2. Create content that fits seamlessly into the existing document, correctly using all defined terms.
        3. Use appropriate legal language and terminology consistent with the document type and jurisdiction.
        4. Keep the drafted content concise yet comprehensive, covering all necessary aspects of the requested clause or section.
        5. Use proper paragraph breaks and sub-clauses where appropriate for clarity and readability.
        6. Do not use any markdown formatting or special characters.
        7. Adapt the style and tone to match the existing document's formality and complexity.
        8. Include cross-references to other relevant clauses or sections if necessary, using appropriate legal phrasing.
        9. Ensure the content is legally correct and up-to-date with current laws and regulations.
        10. If the clause typically includes enumerations or lists, use appropriate legal numbering (e.g., (a), (b), (c) or (i), (ii), (iii)).
        11. When drafting financial terms, use words for numbers and percentages, followed by numerals in parentheses.
        12. Include any standard boilerplate language typically associated with the requested content type.
        13. Do not include any disclaimers or notes about being an AI.

        Remember to draft the content in a way that it can be seamlessly inserted into the existing document structure. If any specific details are missing from the user's request, draft the content using generally accepted standards for that type of provision.`,
      },
      {
        role: "user",
        content: `User Input: ${input}\n\nExisting Document Content: ${documentContent}\n\nReference Document Content: ${referenceContent}`,
      },
    ],
    maxTokens: 2000,
  });

  return response.text;
}

async function performRAG(query: string, category: string): Promise<{ content: string, citations: string[] }> {
  // Implement RAG logic here
  // This would typically involve using a vector database and retrieval system
  // For now, we'll return a placeholder response
  return {
    content: `Research results for query: "${query}" in category: ${category}`,
    citations: ['https://example.com/citation1', 'https://example.com/citation2'],
  };
}

export const config = {
  api: {
    bodyParser: false,
  },
};