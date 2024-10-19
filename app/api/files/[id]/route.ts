// File: app/api/files/[id]/route.ts

import { NextResponse } from 'next/server';
import { getFile, updateFile, deleteFile, addChatMessage } from '@/lib/mockDb';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  console.log(`GET request for file with id: ${params.id}`);
  const file = getFile(params.id);
  if (file) {
    console.log(`File found: ${JSON.stringify(file)}`);
    return NextResponse.json(file);
  } else {
    console.log(`File not found for id: ${params.id}`);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  console.log(`PUT request for file with id: ${params.id}`);
  const data = await request.json();
  const updatedFile = { ...data, id: params.id, isSaved: true };
  updateFile(updatedFile);
  console.log(`File updated: ${JSON.stringify(updatedFile)}`);
  return NextResponse.json(updatedFile);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  console.log(`PATCH request for file with id: ${params.id}`);
  const data = await request.json();
  const existingFile = getFile(params.id);
  if (existingFile) {
    const updatedFile = { ...existingFile, ...data };
    updateFile(updatedFile);
    console.log(`File updated: ${JSON.stringify(updatedFile)}`);
    return NextResponse.json(updatedFile);
  } else {
    console.log(`File not found for id: ${params.id}`);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  console.log(`DELETE request for file with id: ${params.id}`);
  const existingFile = getFile(params.id);
  if (existingFile) {
    deleteFile(params.id);
    console.log(`File deleted: ${params.id}`);
    return NextResponse.json({ message: 'File deleted successfully' });
  } else {
    console.log(`File not found for id: ${params.id}`);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  console.log(`POST request (add chat message) for file with id: ${params.id}`);
  const data = await request.json();
  addChatMessage(params.id, data);
  console.log(`Chat message added to file: ${params.id}`);
  return NextResponse.json({ message: 'Chat message added successfully' });
}