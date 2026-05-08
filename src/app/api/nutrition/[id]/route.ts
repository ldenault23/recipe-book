import { NextRequest, NextResponse } from 'next/server';
import { getRecipe } from '@/lib/store';
import { getNutritionByRecipeId, guessNutritionByIngredients } from '@/lib/nutrition';

export const maxDuration = 15;

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await getRecipe(params.id);
    if (!recipe) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    // Try by Spoonacular ID first
    if (recipe.spoonacularId) {
      const nutrition = await getNutritionByRecipeId(recipe.spoonacularId);
      if (nutrition) {
        return NextResponse.json(nutrition);
      }
    }

    // Fallback: guess from ingredients
    const nutrition = await guessNutritionByIngredients(recipe.ingredients);
    if (nutrition) {
      return NextResponse.json(nutrition);
    }

    return NextResponse.json({ error: 'Nutrition data unavailable' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Nutrition error: ${err?.message || err}` },
      { status: 500 }
    );
  }
}
