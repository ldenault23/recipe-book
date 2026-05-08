/** Spoonacular nutrition client — fetches nutrition data for recipes. */

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY || '';

export interface NutritionInfo {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sourceUrl?: string;
}

export async function getNutritionByRecipeId(
  spoonacularId: number
): Promise<NutritionInfo | null> {
  if (!SPOONACULAR_KEY) return null;

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/${spoonacularId}/nutritionWidget.json`,
      {
        headers: { 'x-api-key': SPOONACULAR_KEY },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.calories || data.calories === '0') return null;

    return {
      calories: data.calories || '?',
      protein: data.protein || '?',
      carbs: data.carbs || '?',
      fat: data.fat || '?',
    };
  } catch {
    return null;
  }
}

export async function guessNutritionByIngredients(
  ingredients: string[]
): Promise<NutritionInfo | null> {
  if (!SPOONACULAR_KEY || !ingredients.length) return null;

  try {
    const res = await fetch(
      'https://api.spoonacular.com/recipes/guessNutrition',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': SPOONACULAR_KEY,
        },
        body: JSON.stringify({
          title: 'Recipe',
          ingredientList: ingredients.join('\n'),
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    if (!data.calories?.value) return null;

    return {
      calories: `${Math.round(data.calories.value)} ${data.calories.unit}`,
      protein: `${Math.round(data.protein?.value || 0)}${data.protein?.unit || 'g'}`,
      carbs: `${Math.round(data.carbs?.value || 0)}${data.carbs?.unit || 'g'}`,
      fat: `${Math.round(data.fat?.value || 0)}${data.fat?.unit || 'g'}`,
    };
  } catch {
    return null;
  }
}
