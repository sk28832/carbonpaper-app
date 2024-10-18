// File: types/chatTypes.ts

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    type: "text" | "changes" | "draft" | "research";
    attachments?: Array<{ name: string; type: "pdf" | "docx" }>;
    status?: "pending" | "accepted" | "rejected" | "inserted";
    citations?: string[];
  }
  
  export interface Change {
    id: string;
    description: string;
    originalText: string;
    suggestedText: string;
    status: "pending" | "accepted" | "rejected";
  }
  
  export interface Placeholder {
    id: string;
    name: string;
    value: string;
  }
  
  export type InputMode = "question" | "edit" | "draft" | "research";