// File: types/fileTypes.ts

import { Message } from '@/types/chatTypes';

export interface TrackedChanges {
  original: string;
  versions: string[];
  currentVersionIndex: number;
}

export interface FileItem {
  id: string;
  name: string;
  content: string;
  isSaved: boolean;
  messages: Message[];
  trackedChanges: TrackedChanges | null;
}