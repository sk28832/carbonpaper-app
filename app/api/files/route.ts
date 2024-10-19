// File: app/api/files/route.ts

import { NextResponse } from 'next/server';
import { getAllFiles, addFile } from '@/lib/mockDb';

export async function GET() {
  console.log('GET request for all files');
  const files = getAllFiles();
  console.log(`Returning ${files.length} files:`, files);
  return NextResponse.json(files);
}

export async function POST(request: Request) {
  console.log('POST request to create new file');
  const data = await request.json();
  
  if (!data.name || !data.content) {
    console.log('Invalid data: name and content are required');
    return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
  }

  const newFile = addFile({
    name: data.name,
    content: data.content,
    isSaved: true,
  });

  console.log(`New file created: ${JSON.stringify(newFile)}`);
  return NextResponse.json(newFile, { status: 201 });
}