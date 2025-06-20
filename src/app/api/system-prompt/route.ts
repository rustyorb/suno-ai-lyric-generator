import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'src/services/prompts/lyricGeneration.md');
    const prompt = await fs.readFile(filePath, 'utf-8');
    return NextResponse.json({ prompt });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load system prompt' }, { status: 500 });
  }
}
