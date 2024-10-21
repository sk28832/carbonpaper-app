// File: lib/mockDb.ts

import { FileItem, TrackedChanges } from '@/types/fileTypes';
import { Message } from '@/types/chatTypes';

// Declare a global variable to store the database instance
declare global {
  var mockDb: MockDatabase | undefined;
}

class MockDatabase {
  private files: FileItem[];
  private nextId: number;

  constructor() {
    this.files = [
      { id: '1', name: 'Document 1', content: '<p>Content of Document 1</p>', isSaved: true, messages: [], trackedChanges: null },
      { id: '2', name: 'Document 2', content: '<p>Content of Document 2</p>', isSaved: true, messages: [], trackedChanges: null },
    ];
    this.nextId = 3;
  }

  getAllFiles(): FileItem[] {
    return this.files;
  }

  getFile(id: string): FileItem | undefined {
    const file = this.files.find(f => f.id === id);
    return file;
  }

  addFile(file: Omit<FileItem, 'id' | 'messages' | 'trackedChanges'>): FileItem {
    const newFile: FileItem = { ...file, id: this.nextId.toString(), messages: [], trackedChanges: null };
    this.nextId++;
    this.files.push(newFile);
    return newFile;
  }

  updateFile(updatedFile: FileItem): void {
    const index = this.files.findIndex(f => f.id === updatedFile.id);
    if (index !== -1) {
      this.files[index] = updatedFile;
    } else {
      this.files.push(updatedFile);
    }
  }

  deleteFile(id: string): void {
    const initialLength = this.files.length;
    this.files = this.files.filter(f => f.id !== id);
  }

  addChatMessage(fileId: string, message: Message): void {
    const file = this.getFile(fileId);
    if (file) {
      file.messages.push(message);
      this.updateFile(file);
    }
  }

  getChatMessages(fileId: string): Message[] {
    const file = this.getFile(fileId);
    return file ? file.messages : [];
  }

  updateChatMessages(fileId: string, messages: Message[]): void {
    const file = this.getFile(fileId);
    if (file) {
      file.messages = messages;
      this.updateFile(file);
    }
  }

  updateTrackedChanges(fileId: string, trackedChanges: TrackedChanges | null): void {
    const file = this.getFile(fileId);
    if (file) {
      file.trackedChanges = trackedChanges;
      this.updateFile(file);
    }
  }
}

// Use a global variable to store the database instance
const db = global.mockDb || (global.mockDb = new MockDatabase());

export const getAllFiles = () => db.getAllFiles();
export const getFile = (id: string) => db.getFile(id);
export const addFile = (file: Omit<FileItem, 'id' | 'messages' | 'trackedChanges'>) => db.addFile(file);
export const updateFile = (file: FileItem) => db.updateFile(file);
export const deleteFile = (id: string) => db.deleteFile(id);
export const addChatMessage = (fileId: string, message: Message) => db.addChatMessage(fileId, message);
export const getChatMessages = (fileId: string) => db.getChatMessages(fileId);
export const updateChatMessages = (fileId: string, messages: Message[]) => db.updateChatMessages(fileId, messages);
export const updateTrackedChanges = (fileId: string, trackedChanges: TrackedChanges | null) => db.updateTrackedChanges(fileId, trackedChanges);