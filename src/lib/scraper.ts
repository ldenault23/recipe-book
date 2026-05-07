/** Robust recipe scraper — tries Spoonacular API first, then falls back to
 *  recursive JSON-LD, microdata, and broad HTML extraction. */

import * as cheerio from 'cheerio';

const SPOONACULAR_KEY = process.env.SPOONACULAR_API_KEY || '';

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
  partial?: boolean; // true if we got something but not everything
}

// ── Helpers ──────────────────────────────────────────────────

function isoDurationToMinutes(iso: string): string | undefined {
  const match = iso.match(
    /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );
  if (!match) return undefined;
  const parts: string[] = [];
  if (match[2]) parts.push(`${match[2]} hr`);
  if (match[3]) parts.push(`${match[3]} min`);
  return parts.length > 0 ? parts.join(' ') : undefined;
}

function extractSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    const parts = hostname.split('.');
    return parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
  } catch {
    return 'Website';
  }
}

function cleanText(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

// ── Fetch with retry ─────────────────────────────────────────

async function fetchHtml(url: string): Promise<string | null> {
  const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  ];

  // Try direct fetch first
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ua = USER_AGENTS[attempt % USER_AGENTS.length];
      const response = await fetch(url, {
        headers: {
          'User-Agent': ua,
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 500) return text; // got real content
      }
    } catch {
      // try next
    }
  }

  // Fallback: try via textise dot iitty proxy
  const PROXIES = [
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];

  for (const proxyUrl of PROXIES) {
    try {
      const response = await fetch(proxyUrl, {
        headers: { 'User-Agent': USER_AGENTS[0] },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        const text = await response.text();
        if (text && text.length > 500) return text;
      }
    } catch {
      // try next proxy
    }
  }

  return null;
}

// ── Method 1: Spoonacular API (primary) ────────────────────

async function scrapeWithSpoonacular(url: string): Promise<ScrapedRecipe | null> {
  if (!SPOONACULAR_KEY) return null;

  try {
    const apiUrl = `https://api.spoonacular.com/recipes/extract?url=${encodeURIComponent(url)}&apiKey=${SPOONACULAR_KEY}`;
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data || !data.title) return null;

    const ingredients: string[] = (data.extendedIngredients || [])
      .map((i: { original?: string; name?: string }) => i.original || i.name || '')
      .filter(Boolean);

    const instructions: string[] = [];
    if (Array.isArray(data.analyzedInstructions)) {
      for (const section of data.analyzedInstructions) {
        if (section.steps) {
          for (const step of section.steps) {
            if (step.step) instructions.push(cleanText(step.step));
          }
        }
      }
    }
    // Fallback to plain instructions string
    if (instructions.length === 0 && data.instructions) {
      const $ = cheerio.load(`<div>${data.instructions}</div>`);
      $('li, p').each((_i, el) => {
        const text = cleanText($(el).text());
        if (text && text.length > 5) instructions.push(text);
      });
      if (instructions.length === 0) {
        instructions.push(cleanText(data.instructions));
      }
    }

    return {
      title: data.title || '',
      description: data.summary
        ? cleanText(data.summary.replace(/<[^>]*>/g, '')).slice(0, 300)
        : undefined,
      imageUrl: data.image || undefined,
      sourceUrl: data.sourceUrl || url,
      sourceName: data.sourceName || extractSourceName(url),
      ingredients,
      instructions,
      prepTime: data.preparationMinutes
        ? `${data.preparationMinutes} min`
        : undefined,
      cookTime: data.cookingMinutes
        ? `${data.cookingMinutes} min`
        : undefined,
      totalTime: data.readyInMinutes
        ? `${data.readyInMinutes} min`
        : undefined,
      servings: data.servings ? String(data.servings) : undefined,
    };
  } catch {
    return null;
  }
}

// ── Method 2: Recursive JSON-LD hunt ────────────────────────

function huntJsonLdRecursive(
  data: unknown,
  sourceUrl: string
): ScrapedRecipe | null {
  if (!data || typeof data !== 'object') return null;

  if (Array.isArray(data)) {
    for (const item of data) {
      const found = huntJsonLdRecursive(item, sourceUrl);
      if (found) return found;
    }
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Check if this object is a Recipe
  const type = obj['@type'];
  const isRecipe =
    typeof type === 'string'
      ? type === 'Recipe'
      : Array.isArray(type)
        ? type.includes('Recipe')
        : false;

  if (isRecipe) {
    return extractRecipeFromJsonLd(obj, sourceUrl);
  }

  // Recurse into all properties looking for Recipe
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val && typeof val === 'object') {
      const found = huntJsonLdRecursive(val, sourceUrl);
      if (found) return found;
    }
  }

  return null;
}

function extractRecipeFromJsonLd(
  obj: Record<string, unknown>,
  sourceUrl: string
): ScrapedRecipe {
  const title = cleanText((obj.name as string) || '');

  const description = cleanText((obj.description as string) || '');

  const imageUrl = extractImageUrl(obj.image);

  const servings = obj.recipeYield
    ? Array.isArray(obj.recipeYield)
      ? obj.recipeYield.map(String).join(', ')
      : String(obj.recipeYield)
    : undefined;

  const ingredients: string[] = [];
  if (Array.isArray(obj.recipeIngredient)) {
    for (const ing of obj.recipeIngredient) {
      const s = cleanText(String(ing));
      if (s && s.length > 2) ingredients.push(s);
    }
  }

  const instructions: string[] = [];
  if (Array.isArray(obj.recipeInstructions)) {
    for (const step of obj.recipeInstructions) {
      if (typeof step === 'string') {
        const s = cleanText(step);
        if (s) instructions.push(s);
      } else if (step && typeof step === 'object') {
        const s = cleanText(
          String(
            (step as Record<string, unknown>).text ||
              (step as Record<string, unknown>).description ||
              (step as Record<string, unknown>).name ||
              ''
          )
        );
        if (s) instructions.push(s);
      }
    }
  }

  // Also check for HowToStep array (some sites use this)
  if (instructions.length === 0 && Array.isArray(obj.steps)) {
    for (const step of obj.steps) {
      if (typeof step === 'string') {
        const s = cleanText(step);
        if (s) instructions.push(s);
      } else if (step && typeof step === 'object') {
        const s = cleanText(
          String(
            (step as Record<string, unknown>).text ||
              (step as Record<string, unknown>).description ||
              ''
          )
        );
        if (s) instructions.push(s);
      }
    }
  }

  const prepTime = isoDurationToMinutes(obj.prepTime as string);
  const cookTime = isoDurationToMinutes(obj.cookTime as string);
  const totalTime = isoDurationToMinutes(obj.totalTime as string);

  return {
    title,
    description: description || undefined,
    imageUrl,
    sourceUrl,
    sourceName: extractSourceName(sourceUrl),
    ingredients,
    instructions,
    prepTime,
    cookTime,
    totalTime,
    servings: servings || undefined,
  };
}

function extractImageUrl(image: unknown): string | undefined {
  if (!image) return undefined;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    for (const item of image) {
      const u = extractImageUrl(item);
      if (u) return u;
    }
    return undefined;
  }
  if (typeof image === 'object') {
    const obj = image as Record<string, unknown>;
    return (obj.url as string) || (obj.contentUrl as string) || undefined;
  }
  return undefined;
}

// ── Method 3: Microdata parsing ──────────────────────────────

function extractFromMicrodata(
  $: cheerio.CheerioAPI,
  sourceUrl: string
): ScrapedRecipe | null {
  // Find an element with itemscope and itemtype containing "Recipe"
  const recipeEl = $('[itemscope][itemtype*="Recipe"]').first();
  if (!recipeEl.length) return null;

  const getProp = (prop: string) =>
    cleanText(recipeEl.find(`[itemprop="${prop}"]`).first().text());

  const getListProp = (prop: string): string[] => {
    const items: string[] = [];
    recipeEl.find(`[itemprop="${prop}"]`).each((_i, el) => {
      const text = cleanText($(el).text());
      if (text && text.length > 2) items.push(text);
    });
    return items;
  };

  const title = getProp('name') || '';
  const imageEl = recipeEl.find('[itemprop="image"]').first();
  const imageUrl =
    imageEl.attr('src') ||
    imageEl.attr('content') ||
    undefined;
  const description = getProp('description') || undefined;
  const ingredients = getListProp('recipeIngredient');
  const instructionsRaw = getListProp('recipeInstructions');
  // Unwrap HowToStep items if nested
  const instructions: string[] = [];
  recipeEl
    .find('[itemprop="recipeInstructions"] [itemprop="text"]')
    .each((_i, el) => {
      const s = cleanText($(el).text());
      if (s) instructions.push(s);
    });
  if (instructions.length === 0) instructions.push(...instructionsRaw);

  const prepTime = getProp('prepTime') || undefined;
  const cookTime = getProp('cookTime') || undefined;
  const servings = getProp('recipeYield') || undefined;

  if (!title) return null;

  return {
    title,
    description,
    imageUrl,
    sourceUrl,
    sourceName: extractSourceName(sourceUrl),
    ingredients,
    instructions,
    prepTime: prepTime ? isoDurationToMinutes(prepTime) || prepTime : undefined,
    cookTime: cookTime ? isoDurationToMinutes(cookTime) || cookTime : undefined,
    servings,
  };
}

// ── Method 4: Broad HTML fallback ────────────────────────────

function extractFromHtml(
  $: cheerio.CheerioAPI,
  sourceUrl: string
): ScrapedRecipe | null {
  // ── Title ──
  let title =
    $('[itemprop="name"]').first().text() ||
    $('meta[property="og:title"]').attr('content') ||
    $('h1').first().text() ||
    $('title').text() ||
    '';
  title = cleanText(title);

  // Remove site name suffix (e.g. "Recipe - Allrecipes")
  title = title.replace(
    /\s*[–—|-]\s*(Allrecipes|Food Network|NYT Cooking|Bon App[eé]tit|BBC Good Food|Epicurious|Delish|Tasty).*$/i,
    ''
  ).trim();

  if (!title) return null;

  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    undefined;

  const imageUrl =
    $('meta[property="og:image"]').attr('content') ||
    $('[itemprop="image"]').attr('src') ||
    $('[itemprop="image"]').attr('content') ||
    undefined;

  const sourceName = extractSourceName(sourceUrl);

  // ── Ingredients ──
  const ingredients: string[] = [];
  const ingredientSelectors = [
    // Schema
    '[itemprop="recipeIngredient"]',
    // Class-based: broad patterns that match many sites
    '[class*="ingredient-list"] li',
    '[class*="ingredients"] li',
    '[class*="ingredient"] li',
    '[class*="recipe-ingredient"] li',
    '.recipe-ingredients li',
    '.ingredients-list li',
    // Common named sections
    'h2:contains("Ingredient"), h3:contains("Ingredient"), h4:contains("Ingredient")',
    // Lists directly inside common wrappers
    '.wprm-recipe-ingredient',
    '.tasty-recipes-ingredients li',
    '.mv-create-ingredients li',
    '.recipe-card__ingredient',
    // Generic: ul directly after an "Ingredients" heading
  ];

  // Try selector groups
  const combined = ingredientSelectors.join(', ');
  $(combined).each((_i, el) => {
    const text = cleanText($(el).text());
    if (text && text.length > 2 && text.length < 500) {
      // Avoid duplicates and headings
      if (
        !text.toLowerCase().startsWith('ingredient') &&
        !ingredients.includes(text)
      ) {
        ingredients.push(text);
      }
    }
  });

  // Fallback: find "Ingredients" heading and grab adjacent ul/ol
  if (ingredients.length === 0) {
    let found = false;
    $('h1, h2, h3, h4, p, div, span').each((_i, el) => {
      if (found) return;
      const text = $(el).text().trim().toLowerCase();
      if (
        text === 'ingredients' ||
        text.startsWith('ingredients') ||
        text === 'what you need' ||
        text.startsWith('for the')
      ) {
        // Grab next ul/ol
        const nextList = $(el).nextAll('ul, ol').first();
        if (nextList.length) {
          nextList.find('li').each((_j, li) => {
            const t = cleanText($(li).text());
            if (t && t.length > 2 && t.length < 500) ingredients.push(t);
          });
          if (ingredients.length > 0) found = true;
        }
      }
    });
  }

  // ── Instructions ──
  const instructions: string[] = [];
  const instructionSelectors = [
    '[itemprop="recipeInstructions"] li',
    '[itemprop="recipeInstructions"]',
    '[class*="instruction"] li',
    '[class*="instructions"] li',
    '[class*="steps"] li',
    '[class*="directions"] li',
    '[class*="method"] li',
    '.recipe-instructions li',
    '.recipe-steps li',
    '.recipe-directions li',
    '.wprm-recipe-instruction',
    '.tasty-recipes-instructions li',
    '.mv-create-instructions li',
    '.recipe-card__instruction',
    '.recipe__method li',
    '.directions li',
    '.preparation li',
  ];

  const combinedInst = instructionSelectors.join(', ');
  $(combinedInst).each((_i, el) => {
    // Skip if this element is inside an ingredient section
    if ($(el).closest('[class*="ingredient"]').length > 0) return;
    const text = cleanText($(el).text());
    if (text && text.length > 5 && text.length < 2000) {
      if (!instructions.includes(text)) instructions.push(text);
    }
  });

  // Fallback: find "Instructions" heading and grab adjacent ol
  if (instructions.length === 0) {
    $('h1, h2, h3, h4, p, div').each((_i, el) => {
      const text = $(el).text().trim().toLowerCase();
      if (
        text === 'instructions' ||
        text === 'directions' ||
        text === 'method' ||
        text.startsWith('instructions') ||
        text.startsWith('directions') ||
        text.startsWith('method')
      ) {
        const nextList = $(el).nextAll('ol, ul').first();
        if (nextList.length) {
          nextList.find('li').each((_j, li) => {
            const t = cleanText($(li).text());
            if (t && t.length > 5 && t.length < 2000) instructions.push(t);
          });
        }
      }
    });
  }

  // If we got at least a title, return partial
  if (title) {
    return {
      title,
      description,
      imageUrl,
      sourceUrl,
      sourceName,
      ingredients,
      instructions,
      partial: ingredients.length === 0 && instructions.length === 0,
    };
  }

  return null;
}

// ── Main export ──────────────────────────────────────────────

export async function scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
  // 1. Try Spoonacular API (most reliable)
  if (SPOONACULAR_KEY) {
    const spoonResult = await scrapeWithSpoonacular(url);
    if (spoonResult && spoonResult.title) {
      return spoonResult;
    }
  }

  // 2. Fall back to local scraping
  const html = await fetchHtml(url);
  if (!html) return null;

  const $ = cheerio.load(html);

  // 3. Try JSON-LD (recursive hunt — handles @graph, mainEntity, nesting)
  const scripts = $('script[type="application/ld+json"]').toArray();
  for (const el of scripts) {
    try {
      const text = $(el).html();
      if (!text) continue;
      const parsed = JSON.parse(text);
      const recipe = huntJsonLdRecursive(parsed, url);
      if (recipe && recipe.title && recipe.ingredients.length > 0) {
        return recipe;
      }
    } catch {
      // skip malformed blocks
    }
  }

  // 4. Try microdata
  const micro = extractFromMicrodata($, url);
  if (micro && micro.title && micro.ingredients.length > 0) {
    return micro;
  }

  // 5. Broad HTML fallback
  const htmlFallback = extractFromHtml($, url);
  if (htmlFallback && htmlFallback.title) {
    return htmlFallback;
  }

  return null;
}
