import { NextRequest, NextResponse } from 'next/server';
import { removeRecipe, getRecipe } from '@/lib/store';

// GET /api/recipes/[id] — get single recipe
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await getRecipe(params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json(recipe);
  } catch {
    return NextResponse.json({ error: 'Failed to load recipe' }, { status: 500 });
  }
}

// DELETE /api/recipes/[id] — remove a recipe
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const removed = await removeRecipe(params.id);
    if (!removed) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to remove recipe' }, { status: 500 });
  }
}
