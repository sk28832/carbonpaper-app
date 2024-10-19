// File: lib/mockDb.ts

import { FileItem } from '@/types/fileTypes';
import { Message } from '@/types/chatTypes';

let files: FileItem[] = [
  { id: '1', name: 'Document 1', content: '<p>Content of Document 1</p>', isSaved: true, messages: [] },
  { id: '2', name: 'Document 2', content: '<p>Content of Document 2</p>', isSaved: true, messages: [] },
];

let nextId = 3;

export function getAllFiles(): FileItem[] {
  return files;
}

export function getFile(id: string): FileItem | undefined {
  return files.find(f => f.id === id);
}

export function addFile(file: Omit<FileItem, 'id' | 'messages'>): FileItem {
  const newFile: FileItem = { ...file, id: nextId.toString(), messages: [] };
  nextId++;
  files.push(newFile);
  return newFile;
}

export function updateFile(updatedFile: FileItem): void {
  const index = files.findIndex(f => f.id === updatedFile.id);
  if (index !== -1) {
    files[index] = updatedFile;
  } else {
    files.push(updatedFile);
  }
}

export function deleteFile(id: string): void {
  files = files.filter(f => f.id !== id);
}

export function addChatMessage(fileId: string, message: Message): void {
  const file = getFile(fileId);
  if (file) {
    file.messages.push(message);
    updateFile(file);
  }
}

export function getChatMessages(fileId: string): Message[] {
  const file = getFile(fileId);
  return file ? file.messages : [];
}

export function updateChatMessages(fileId: string, messages: Message[]): void {
  const file = getFile(fileId);
  if (file) {
    file.messages = messages;
    updateFile(file);
  }
}