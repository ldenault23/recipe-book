/** DeepSeek AI client — powers auto-tagging, chat assistant, meal planning,
 *  and shopping list generation. OpenAI-compatible API. */

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || '';
const BASE_URL = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

async function chat(messages: Message[], temperature = 0.7): Promise<string> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature,
      max_tokens: 2000,
    }),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`DeepSeek API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

// ── Auto-tagging ─────────────────────────────────────────────

export async function suggestTags(recipe: {
  title: string;
  ingredients: string[];
  instructions: string[];
}): Promise<string[]> {
  const prompt = `Given this recipe, suggest 2-5 relevant tags/categories. Choose from common tags like: breakfast, lunch, dinner, snack, dessert, quick, vegetarian, chicken, beef, seafood, pork, pasta, soup, salad, sandwich, casserole, one-pot, slow-cooker, meal-prep, high-protein, low-carb, spicy, comfort-food, Italian, Mexican, Asian, American, etc.

Return ONLY a JSON array of strings, like: ["dinner", "comfort-food", "pasta"]

Recipe:
Title: ${recipe.title}
Ingredients: ${recipe.ingredients.slice(0, 20).join(', ')}
Instructions: ${recipe.instructions.slice(0, 3).join(' ')}`;

  const result = await chat([
    { role: 'system', content: 'You are a recipe tagging assistant. Return only valid JSON arrays.' },
    { role: 'user', content: prompt },
  ], 0.3);

  try {
    const parsed = JSON.parse(result.trim());
    if (Array.isArray(parsed)) return parsed.map((t: string) => t.toLowerCase().trim());
  } catch {
    // fallback: extract from non-JSON response
    const matches = result.match(/"[^"]+"/g);
    if (matches) return matches.map((m: string) => m.replace(/"/g, '').toLowerCase().trim());
  }
  return [];
}

// ── General chat assistant ──────────────────────────────────

export async function chatAssistant(
  userMessage: string,
  recipes: { title: string; id: string; ingredients: string[]; instructions: string[]; tags: string[]; prepTime?: string; cookTime?: string; servings?: string }[],
  history: Message[] = []
): Promise<string> {
  const recipeList = recipes.map((r, i) =>
    `${i + 1}. "${r.title}" [tags: ${r.tags?.join(', ') || 'none'}] — ${r.ingredients?.length || 0} ingredients, ${r.servings || '?'} servings`
  ).join('\n');

  const system = `You are a helpful recipe assistant for "Olivia's Recipe Book". You have access to the following recipes:

${recipeList || 'No recipes yet.'}

You can help with:
- Meal planning (suggest which recipes to make this week)
- Shopping lists (consolidate ingredients from multiple recipes)
- Recipe questions (ingredients, instructions, substitutions)
- What to cook based on available ingredients
- Nutrition advice and dietary suggestions
- Categorizing and tagging recipes

Be warm, practical, and concise. When making meal plans or shopping lists, use clear formatting. When suggesting recipes, use the exact recipe titles from the list.`;

  const messages: Message[] = [
    { role: 'system', content: system },
    ...history,
    { role: 'user', content: userMessage },
  ];

  return chat(messages);
}

// ── Meal plan generation ────────────────────────────────────

export async function generateMealPlan(
  recipes: { title: string; id: string; tags: string[]; ingredients: string[]; servings?: string; prepTime?: string; cookTime?: string }[],
  preferences: string = ''
): Promise<string> {
  const recipeList = recipes.map((r, i) =>
    `${i + 1}. "${r.title}" — tags: ${r.tags?.join(', ') || 'none'}, servings: ${r.servings || '?'}`
  ).join('\n');

  const pref = preferences ? `Preferences: ${preferences}` : 'No specific preferences.';

  const prompt = `Create a 5-day meal plan (Monday-Friday) using these recipes. Use each recipe at most once. Include breakfast, lunch, and dinner for each day. If there aren't enough breakfast recipes, suggest simple breakfasts (like oatmeal, eggs, toast). Format clearly with days and meals.

${pref}

Available recipes:
${recipeList}`;

  return chat([
    { role: 'system', content: 'You are a meal planning assistant. Format meal plans clearly with day headings and meals.' },
    { role: 'user', content: prompt },
  ], 0.5);
}

// ── Shopping list ───────────────────────────────────────────

export async function generateShoppingList(
  selectedRecipes: { title: string; ingredients: string[]; servings?: string }[],
  notes: string = ''
): Promise<string> {
  const recipeText = selectedRecipes.map(r =>
    `"${r.title}" (${r.servings || '?'} servings): ${r.ingredients.join('; ')}`
  ).join('\n\n');

  const prompt = `Consolidate these recipe ingredients into a single organized shopping list. Combine duplicate ingredients (e.g., "2 tbsp butter" + "1/4 cup butter" = combine). Group items by category (Produce, Dairy, Meat, Pantry, etc.). List quantities clearly.

${notes ? `Notes: ${notes}` : ''}

Recipes:
${recipeText}

Return the shopping list grouped by category.`;

  return chat([
    { role: 'system', content: 'You are a shopping list organizer. Group items by store section. Combine duplicate ingredients with total quantities.' },
    { role: 'user', content: prompt },
  ], 0.3);
}
