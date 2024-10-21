import { NextResponse } from 'next/server';
import { generateText } from 'ai';
import { openai } from '@/lib/openai';

export async function POST(request: Request) {
  const { selectedText, command } = await request.json();

  if (!selectedText || !command) {
    return NextResponse.json({ error: 'Invalid request format' }, { status: 400 });
  }

  try {
    const promptMap = {
      improve: "Improve the following text while maintaining its original meaning:",
      fixGrammar: "Fix any grammatical errors in the following text:",
      shorter: "Make the following text more concise while maintaining its key points:",
      longer: "Expand on the following text to provide more detail:",
    };

    const prompt = promptMap[command as keyof typeof promptMap] || promptMap.improve;

    const response = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `You are an AI assistant specialized in improving legal text. Your task is to ${prompt.toLowerCase()} Follow these guidelines:

          1. Keep the essence and intent of the original text intact.
          2. Maintain the formal tone appropriate for legal documents.
          3. Ensure that your suggestions are grammatically correct and properly punctuated.
          4. Do not add any explanations or comments about the changes.
          5. Return only the improved text, without any additional formatting or markup.`,
        },
        {
          role: "user",
          content: `${prompt}\n\n${selectedText}`,
        },
      ],
      maxTokens: 1000,
    });

    return NextResponse.json({ text: response.text });
  } catch (error) {
    console.error('Error in hoverbar endpoint:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: true,
  },
};