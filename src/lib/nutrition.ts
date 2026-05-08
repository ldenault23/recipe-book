/** Spoonacular nutrition client — fetches nutrition data for recipes. */

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY || '';

export interface NutritionInfo {
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  fiber?: string;
  sugar?: string;
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
      `https://api.spoonacular.com/recipes/guessNutrition?apiKey=${SPOONACULAR_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Recipe',
          ingredientList: ingredients.join('\n'),
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();

    return {
      calories: data.calories?.value
        ? `${Math.round(data.calories.value)} ${data.calories.unit}`
        : '?',
      protein: data.protein?.value
        ? `${Math.round(data.protein.value)}${data.protein.unit}`
        : '?',
      carbs: data.carbs?.value
        ? `${Math.round(data.carbs.value)}${data.carbs.unit}`
        : '?',
      fat: data.fat?.value
        ? `${Math.round(data.fat.value)}${data.fat.unit}`
        : '?',
    };
  } catch {
    return null;
  }
}
