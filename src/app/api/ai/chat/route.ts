import { NextRequest, NextResponse } from 'next/server';
import { chatAssistant, generateMealPlan, generateShoppingList } from '@/lib/ai';
import { getAllRecipes } from '@/lib/store';

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [], mode } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 });
    }

    // Load recipes for context
    const allRecipes = await getAllRecipes();
    const recipes = allRecipes.map(r => ({
      title: r.title,
      id: r.id,
      ingredients: r.ingredients,
      instructions: r.instructions,
      tags: r.tags || [],
      prepTime: r.prepTime,
      cookTime: r.cookTime,
      servings: r.servings,
    }));

    // Mode-specific handling
    if (mode === 'mealplan') {
      const plan = await generateMealPlan(recipes, message);
      return NextResponse.json({ reply: plan });
    }

    if (mode === 'shopping') {
      // Parse selected recipe IDs from the request
      const selectedIds: string[] = body.selectedIds || [];
      let selectedRecipes = selectedIds.length > 0
        ? allRecipes.filter(r => selectedIds.includes(r.id))
        : allRecipes; // fallback: use all

      const list = await generateShoppingList(
        selectedRecipes.map(r => ({
          title: r.title,
          ingredients: r.ingredients,
          servings: r.servings,
        })),
        message
      );
      return NextResponse.json({ reply: list });
    }

    // General chat
    const reply = await chatAssistant(message, recipes, history);
    return NextResponse.json({ reply });
  } catch (err: any) {
    return NextResponse.json(
      { error: `AI error: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
