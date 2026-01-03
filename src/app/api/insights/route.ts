import { NextResponse } from 'next/server';
import { generateForTask } from '@/ai/vertex';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { task, input } = body;
    if (!task) return NextResponse.json({ error: 'task is required' }, { status: 400 });

    const text = await generateForTask(task, input);
    // Return the raw generated text as JSON. Client can parse as needed.
    return NextResponse.json({ text });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Unknown error' }, { status: 500 });
  }
}
