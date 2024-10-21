// File: types/chatTypes.ts

import { TrackedChanges } from "@/types/fileTypes";

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  type: "text" | "edit";
  trackedChanges?: TrackedChanges;
  status?: "pending" | "accepted" | "rejected" | "inserted";
  citations?: string[];
}

export interface Placeholder {
  id: string;
  name: string;
  value: string;
}

export type InputMode = "question" | "edit";