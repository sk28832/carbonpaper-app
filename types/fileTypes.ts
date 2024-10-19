// File: types/fileTypes.ts

import { Message } from '@/types/chatTypes';

export interface FileItem {
  id: string;
  name: string;
  content: string;
  isSaved: boolean;
  messages: Message[];
}