import { NextRequest, NextResponse } from 'next/server';
import { getAllRecipes, addRecipe, type Recipe } from '@/lib/store';
import { scrapeRecipe } from '@/lib/scraper';

export const maxDuration = 30; // seconds (pro plan for >10)

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
      const debug: string[] = [];
      const hasKey = !!process.env.SPOONACULAR_API_KEY;
      debug.push(`Spoonacular key ${hasKey ? 'found' : 'MISSING'}`);

      let scraped = await scrapeRecipe(body.url);
      if (!scraped) {
        return NextResponse.json({
          error: 'Could not extract anything from this URL. The site may block automated access, or the recipe might be behind a login. Try adding manually or use a different recipe site.',
          debug,
        }, { status: 422 });
      }

      // Warn if partial extraction
      const warning = scraped.partial
        ? 'Only the title was found — ingredients and instructions could not be extracted. You can edit the recipe after importing.'
        : scraped.ingredients.length === 0
          ? 'Recipe imported but no ingredients were found. You may need to add them manually.'
          : undefined;

      const { partial, ...recipeData } = scraped;

      const recipe = await addRecipe({
        ...recipeData,
        tags: body.tags || [],
        notes: body.notes || '',
      });

      return NextResponse.json({
        recipe,
        scraped: true,
        warning,
        debug: [...debug, `Ingredients: ${recipeData.ingredients.length}, Instructions: ${recipeData.instructions.length}`],
      });
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
