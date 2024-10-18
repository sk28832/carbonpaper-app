// File: types/fileTypes.ts

export interface FileItem {
  id: string;
  name: string;
  content: string;
  isSaved: boolean;
  chatMessages: { text: string; isUser: boolean }[];
}