import { NextResponse } from 'next/server';
import { getAllFiles, addFile } from '@/lib/mockDb';
import { FileItem } from '@/types/fileTypes';

export async function GET() {
  return NextResponse.json(getAllFiles());
}

export async function POST(request: Request) {
  const data = await request.json();
  const newFile = addFile({
    name: data.name,
    content: data.content,
    isSaved: true,
  });
  return NextResponse.json(newFile, { status: 201 });
}