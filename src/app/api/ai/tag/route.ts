import { NextRequest, NextResponse } from 'next/server';
import { suggestTags } from '@/lib/ai';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, ingredients, instructions } = body;

    if (!title || !ingredients) {
      return NextResponse.json({ error: 'Title and ingredients required' }, { status: 400 });
    }

    const tags = await suggestTags({ title, ingredients, instructions: instructions || [] });
    return NextResponse.json({ tags });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Tagging failed: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
