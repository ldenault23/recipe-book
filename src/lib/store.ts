/** Recipe data store with Vercel KV (production) + local JSON fallback (development). */

export interface Recipe {
  id: string;
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
  tags: string[];
  notes?: string;
  dateAdded: string;
}

const RECIPES_KEY = 'recipe-book:recipes';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ── Vercel KV Store ──────────────────────────────────────────
async function kvStore(): Promise<{
  getAll: () => Promise<Recipe[]>;
  add: (recipe: Omit<Recipe, 'id' | 'dateAdded'>) => Promise<Recipe>;
  remove: (id: string) => Promise<boolean>;
  get: (id: string) => Promise<Recipe | null>;
}> {
  const { kv } = await import('@vercel/kv');

  async function getAll(): Promise<Recipe[]> {
    const data = await kv.get<Recipe[]>(RECIPES_KEY);
    return data || [];
  }

  async function add(recipe: Omit<Recipe, 'id' | 'dateAdded'>): Promise<Recipe> {
    const recipes = await getAll();
    const newRecipe: Recipe = {
      ...recipe,
      id: generateId(),
      dateAdded: new Date().toISOString(),
    };
    recipes.unshift(newRecipe);
    await kv.set(RECIPES_KEY, recipes);
    return newRecipe;
  }

  async function remove(id: string): Promise<boolean> {
    const recipes = await getAll();
    const filtered = recipes.filter(r => r.id !== id);
    if (filtered.length === recipes.length) return false;
    await kv.set(RECIPES_KEY, filtered);
    return true;
  }

  async function get(id: string): Promise<Recipe | null> {
    const recipes = await getAll();
    return recipes.find(r => r.id === id) || null;
  }

  return { getAll, add, remove, get };
}

// ── Local JSON Store (development fallback) ───────────────────
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'recipes.json');

function ensureDataDir() {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]', 'utf-8');
  }
}

function readLocal(): Recipe[] {
  ensureDataDir();
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeLocal(recipes: Recipe[]) {
  ensureDataDir();
  fs.writeFileSync(DATA_FILE, JSON.stringify(recipes, null, 2), 'utf-8');
}

function localStore() {
  return {
    getAll: async () => readLocal(),
    add: async (recipe: Omit<Recipe, 'id' | 'dateAdded'>) => {
      const recipes = readLocal();
      const newRecipe: Recipe = {
        ...recipe,
        id: generateId(),
        dateAdded: new Date().toISOString(),
      };
      recipes.unshift(newRecipe);
      writeLocal(recipes);
      return newRecipe;
    },
    remove: async (id: string) => {
      const recipes = readLocal();
      const filtered = recipes.filter(r => r.id !== id);
      if (filtered.length === recipes.length) return false;
      writeLocal(filtered);
      return true;
    },
    get: async (id: string) => {
      const recipes = readLocal();
      return recipes.find(r => r.id === id) || null;
    },
  };
}

// ── Unified export ────────────────────────────────────────────
function hasKVConfig(): boolean {
  return !!(
    process.env.KV_URL ||
    process.env.KV_REST_API_URL
  );
}

let _store: ReturnType<typeof localStore> | null = null;

async function getStore() {
  if (_store) return _store;
  if (hasKVConfig()) {
    _store = await kvStore();
  } else {
    _store = localStore();
  }
  return _store;
}

export async function getAllRecipes(): Promise<Recipe[]> {
  const store = await getStore();
  return store.getAll();
}

export async function addRecipe(recipe: Omit<Recipe, 'id' | 'dateAdded'>): Promise<Recipe> {
  const store = await getStore();
  return store.add(recipe);
}

export async function removeRecipe(id: string): Promise<boolean> {
  const store = await getStore();
  return store.remove(id);
}

export async function getRecipe(id: string): Promise<Recipe | null> {
  const store = await getStore();
  return store.get(id);
}
