// File: app/api/files/route.ts

import { NextResponse } from 'next/server';
import { getAllFiles, addFile } from '@/lib/mockDb';

export async function GET() {
  const files = getAllFiles();
  return NextResponse.json(files);
}

export async function POST(request: Request) {
  const data = await request.json();
  
  if (!data.name || !data.content) {
    return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
  }

  const newFile = addFile({
    name: data.name,
    content: data.content,
    isSaved: true,
  });

  return NextResponse.json(newFile, { status: 201 });
}