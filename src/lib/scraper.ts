/** Scrapes recipe data from a URL by extracting JSON-LD structured data
 *  and falling back to basic HTML parsing. */

import * as cheerio from 'cheerio';

export interface ScrapedRecipe {
  title: string;
  description?: string;
  imageUrl?: string;
  sourceUrl: string;
  sourceName?: string;
  ingredients: string[];
  instructions: string[];
  prepTime?: string;
  cookTime?: string;
  totalTime?: string;
  servings?: string;
}

function isoDurationToMinutes(iso: string): string | undefined {
  // PT1H30M → "1 hr 30 min"
  const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return undefined;
  const parts: string[] = [];
  if (match[2]) parts.push(`${match[2]} hr`);
  if (match[3]) parts.push(`${match[3]} min`);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; RecipeBook/1.0; +https://recipebook.app)',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) return null;

    const html = await response.text();
    const $ = cheerio.load(html);

    // ── Method 1: JSON-LD structured data ─────────────────
    let foundRecipe: ScrapedRecipe | null = null;
    $('script[type="application/ld+json"]').each((_i, el) => {
      if (foundRecipe) return;
      try {
        const text = $(el).html();
        if (!text) return;
        const parsed = JSON.parse(text);
        const recipe = findRecipeInJsonLd(parsed, url);
        if (recipe && recipe.title && recipe.ingredients.length > 0) {
          foundRecipe = recipe;
        }
      } catch {
        // skip malformed JSON-LD
      }
    });
    if (foundRecipe) return foundRecipe;

    // ── Method 2: Basic HTML fallback ─────────────────────
    const fallback = extractFromHtml($, url);
    if (fallback.title && (fallback.ingredients.length > 0 || fallback.instructions.length > 0)) {
      return fallback;
    }

    return fallback.title ? fallback : null;
  } catch {
    return null;
  }
}

function findRecipeInJsonLd(
  data: unknown,
  url: string
): ScrapedRecipe | null {
  if (!data || typeof data !== 'object') return null;

  // Handle @graph pattern
  if ('@graph' in data && Array.isArray((data as Record<string, unknown>)['@graph'])) {
    for (const item of (data as Record<string, unknown>)['@graph'] as unknown[]) {
      const recipe = findRecipeInJsonLd(item, url);
      if (recipe) return recipe;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;
  const type = obj['@type'];

  // Match Recipe type
  const isRecipe =
    type === 'Recipe' ||
    (Array.isArray(type) && type.includes('Recipe'));

  if (!isRecipe) return null;

  // Extract fields
  const title = (obj.name as string) || '';
  const description = (obj.description as string) || '';
  const imageUrl = extractImageUrl(obj.image);
  const servings = obj.recipeYield
    ? (Array.isArray(obj.recipeYield)
        ? obj.recipeYield.join(', ')
        : String(obj.recipeYield))
    : undefined;

  // Ingredients
  const ingredients: string[] = [];
  if (Array.isArray(obj.recipeIngredient)) {
    ingredients.push(
      ...obj.recipeIngredient.map(i => String(i).trim()).filter(Boolean)
    );
  }

  // Instructions
  const instructions: string[] = [];
  if (Array.isArray(obj.recipeInstructions)) {
    for (const step of obj.recipeInstructions) {
      if (typeof step === 'string') {
        instructions.push(step.trim());
      } else if (typeof step === 'object' && step && 'text' in step) {
        instructions.push(String((step as Record<string, unknown>).text).trim());
      }
    }
  }

  // Times
  const prepTime = isoDurationToMinutes(obj.prepTime as string);
  const cookTime = isoDurationToMinutes(obj.cookTime as string);
  const totalTime = isoDurationToMinutes(obj.totalTime as string);

  // Source name from URL
  const sourceName = extractSourceName(url);

  return {
    title,
    description,
    imageUrl,
    sourceUrl: url,
    sourceName,
    ingredients,
    instructions,
    prepTime,
    cookTime,
    totalTime,
    servings,
  };
}

function extractImageUrl(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (typeof image === 'object') {
    const obj = image as Record<string, unknown>;
    // Array of images
    if (Array.isArray(image)) {
      for (const item of image) {
        const url = extractImageUrl(item);
        if (url) return url;
      }
      return undefined;
    }
    return (obj.url as string) || (obj.contentUrl as string) || undefined;
  }
  return undefined;
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname.split('.')[0].charAt(0).toUpperCase() + hostname.split('.')[0].slice(1);
  } catch {
    return 'Website';
  }
}

function extractFromHtml(
  $: cheerio.CheerioAPI,
  url: string
): ScrapedRecipe {
  // Try common selectors for recipe sites
  const title =
    $('h1').first().text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    $('title').text().trim() ||
    'Untitled Recipe';

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    undefined;

  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    undefined;

  const sourceName = extractSourceName(url);

  // Try to find ingredient lists
  const ingredients: string[] = [];
  // Common ingredient list selectors
  $('li[class*="ingredient"], li[itemprop="recipeIngredient"], .ingredient-item li, .ingredients li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 2) ingredients.push(text);
  });

  // If no ingredients found via selectors, try all list items in recipe sections
  if (ingredients.length === 0) {
    $('.recipe-ingredients li, [class*="recipe"] ul li').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2) ingredients.push(text);
    });
  }

  // Instructions
  const instructions: string[] = [];
  $('li[class*="instruction"], li[itemprop="recipeInstructions"], .instruction-item li, .instructions li, .steps li').each((_, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 5) instructions.push(text);
  });

  if (instructions.length === 0) {
    $('.recipe-instructions ol li, [class*="recipe"] ol li').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 5) instructions.push(text);
    });
  }

  return {
    title,
    description,
    imageUrl,
    sourceUrl: url,
    sourceName,
    ingredients,
    instructions,
  };
}
