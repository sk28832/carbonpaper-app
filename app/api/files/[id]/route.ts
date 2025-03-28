// File: app/api/files/[id]/route.ts

import { NextResponse } from 'next/server';
import { getFile, updateFile, deleteFile, addChatMessage } from '@/lib/mockDb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const file = getFile(params.id);
  if (file) {
    return NextResponse.json(file);
  } else {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const updatedFile = { ...data, id: params.id, isSaved: true };
  updateFile(updatedFile);
  return NextResponse.json(updatedFile);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  const existingFile = getFile(params.id);
  if (existingFile) {
    const updatedFile = { ...existingFile, ...data };
    updateFile(updatedFile);
    return NextResponse.json(updatedFile);
  } else {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const existingFile = getFile(params.id);
  if (existingFile) {
    deleteFile(params.id);
    return NextResponse.json({ message: 'File deleted successfully' });
  } else {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const data = await request.json();
  addChatMessage(params.id, data);
  return NextResponse.json({ message: 'Chat message added successfully' });
}