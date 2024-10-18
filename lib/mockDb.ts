// File: lib/mockDb.ts
import { FileItem } from '@/types/fileTypes';

let files: FileItem[] = [
  { id: '1', name: 'Document 1', content: '<p>Content of Document 1</p>', isSaved: true },
  { id: '2', name: 'Document 2', content: '<p>Content of Document 2</p>', isSaved: true },
];

let nextId = 3;

export function getAllFiles(): FileItem[] {
  return files;
}

export function getFile(id: string): FileItem | undefined {
  return files.find(f => f.id === id);
}

export function addFile(file: Omit<FileItem, 'id'>): FileItem {
  const newFile: FileItem = { ...file, id: nextId.toString() };
  nextId++;
  files.push(newFile);
  return newFile;
}

export function updateFile(updatedFile: FileItem): void {
  const index = files.findIndex(f => f.id === updatedFile.id);
  if (index !== -1) {
    files[index] = updatedFile;
  } else {
    // If the file doesn't exist, add it
    files.push(updatedFile);
  }
}

export function deleteFile(id: string): void {
  files = files.filter(f => f.id !== id);
}