import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, addRecipe, type Recipe } from '@/lib/store';
import { scrapeRecipe } from '@/lib/scraper';

// GET /api/recipes — list all recipes
export async function GET() {
  try {
    const recipes = await getAllRecipes();
    return NextResponse.json(recipes);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load recipes' }, { status: 500 });
  }
}

// POST /api/recipes — add a recipe by URL or manual data
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Mode 1: Import from URL
    if (body.url) {
      const scraped = await scrapeRecipe(body.url);
      if (!scraped) {
        return NextResponse.json(
          { error: 'Could not extract recipe from this URL. Try adding manually.' },
          { status: 422 }
        );
      }

      const recipe = await addRecipe({
        ...scraped,
        tags: body.tags || [],
        notes: body.notes || '',
      });

      return NextResponse.json({ recipe, scraped: true });
    }

    // Mode 2: Manual entry
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required for manual entry' },
        { status: 400 }
      );
    }

    const recipe = await addRecipe({
      title: body.title,
      description: body.description || '',
      imageUrl: body.imageUrl || '',
      sourceUrl: body.sourceUrl || '',
      sourceName: body.sourceName || '',
      ingredients: body.ingredients || [],
      instructions: body.instructions || [],
      prepTime: body.prepTime || '',
      cookTime: body.cookTime || '',
      totalTime: body.totalTime || '',
      servings: body.servings || '',
      tags: body.tags || [],
      notes: body.notes || '',
    });

    return NextResponse.json({ recipe, scraped: false });
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to add recipe' },
      { status: 500 }
    );
  }
}
