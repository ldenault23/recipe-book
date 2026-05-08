'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Recipe } from '@/lib/store';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recipesLoading, setRecipesLoading] = useState(false);

  // Manual entry state
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualIngredients, setManualIngredients] = useState('');
  const [manualInstructions, setManualInstructions] = useState('');
  const [manualTags, setManualTags] = useState('');

  const loadRecipes = useCallback(async () => {
    setRecipesLoading(true);
    try {
      const res = await fetch('/api/recipes');
      const data = await res.json();
      setRecipes(Array.isArray(data) ? data : []);
    } catch {
      // ignore
    }
    setRecipesLoading(false);
  }, []);

  useEffect(() => {
    loadRecipes();
  }, [loadRecipes]);

  // ── Import from URL ──────────────────────────────────────
  const handleUrlImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), tags: [] }),
      });

      const data = await res.json();

      if (res.ok && data.recipe) {
        const dbg = data.debug ? `\n\n${data.debug.join(' | ')}` : '';
        let msg = `✅ "${data.recipe.title}" imported!`;
        if (data.warning) msg += ` ⚠️ ${data.warning}`;
        msg += dbg;

        // Auto-tag with AI
        setLoading(false);
        setUrl('');
        loadRecipes();
        setMessage({ type: 'success', text: `${msg}\n\n🤖 Auto-tagging...` });

        try {
          const tagRes = await fetch('/api/ai/tag', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: data.recipe.title,
              ingredients: data.recipe.ingredients,
              instructions: data.recipe.instructions,
            }),
          });
          const tagData = await tagRes.json();
          if (tagData.tags?.length) {
            setMessage({
              type: 'success',
              text: `${msg}\n\n🏷️ Suggested tags: ${tagData.tags.join(', ')}`,
            });
          }
        } catch {
          // tags failed silently
        }
        return;
      } else {
        const dbg = data.debug ? `\n\nDebug: ${data.debug.join(' | ')}` : '';
        setMessage({
          type: 'error',
          text: (data.error || 'Could not import recipe. Try adding manually.') + dbg,
        });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' });
    }

    setLoading(false);
  };

  // ── Manual add ───────────────────────────────────────────
  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          ingredients: manualIngredients
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
          instructions: manualInstructions
            .split('\n')
            .map(s => s.trim())
            .filter(Boolean),
          tags: manualTags
            .split(',')
            .map(s => s.trim())
            .filter(Boolean),
        }),
      });

      const data = await res.json();

      if (res.ok && data.recipe) {
        setMessage({ type: 'success', text: `✅ "${data.recipe.title}" added!` });
        setManualTitle('');
        setManualIngredients('');
        setManualInstructions('');
        setManualTags('');
        setShowManual(false);
        loadRecipes();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to add recipe.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Try again.' });
    }

    setLoading(false);
  };

  // ── Delete recipe ────────────────────────────────────────
  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/recipes/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRecipes(prev => prev.filter(r => r.id !== id));
        setMessage({ type: 'success', text: 'Recipe removed.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to remove recipe.' });
    }
  };

  // ── Auth ─────────────────────────────────────────────────
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const adminPassword = '03072026';
    if (password === adminPassword) {
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-8 max-w-sm w-full border border-cream-dark">
          <h1 className="font-bold text-2xl text-warm text-center mb-1">
            Manage Recipes
          </h1>
          <p className="text-sm text-gray-400 text-center mb-6">
            Enter the password to continue
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Password"
              className={`w-full px-4 py-3 rounded-2xl border ${
                passwordError ? 'border-red-300' : 'border-cream-dark'
              } bg-cream/50 focus:outline-none focus:ring-2 focus:ring-sage/20 text-warm`}
              autoFocus
            />
            {passwordError && (
              <p className="text-red-400 text-sm text-center">Wrong password</p>
            )}
            <button
              type="submit"
              className="w-full bg-sage text-white py-3 rounded-2xl font-medium hover:bg-sage-dark transition-colors"
            >
              Enter
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Admin panel ──────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display text-3xl font-bold text-charcoal">
            📋 Manage Recipes
          </h1>
          <a
            href="/"
            className="text-sm text-sage hover:text-sage-dark transition-colors"
          >
            ← View Recipe Book
          </a>
        </div>

        {/* Import from URL */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <h2 className="font-display text-lg font-bold text-charcoal mb-1">
            Import from URL
          </h2>
          <p className="text-sm text-gray-400 mb-4">
            Paste any recipe link — ingredients, instructions, and photos are
            extracted automatically.
          </p>
          <form onSubmit={handleUrlImport} className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://www.example.com/recipe/..."
              className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-sage text-white rounded-xl font-medium hover:bg-sage-dark transition-colors disabled:opacity-50 shrink-0"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </form>

          {/* Toggle manual entry */}
          <button
            onClick={() => setShowManual(!showManual)}
            className="mt-4 text-sm text-terracotta hover:text-terracotta/80 transition-colors"
          >
            {showManual ? 'Hide manual entry' : '+ Add manually instead'}
          </button>
        </div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Manual entry form */}
        {showManual && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
            <h2 className="font-display text-lg font-bold text-charcoal mb-4">
              Add Recipe Manually
            </h2>
            <form onSubmit={handleManualAdd} className="space-y-4">
              <input
                type="text"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="Recipe title *"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal"
                required
              />
              <textarea
                value={manualIngredients}
                onChange={e => setManualIngredients(e.target.value)}
                placeholder="Ingredients (one per line)"
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal resize-y"
              />
              <textarea
                value={manualInstructions}
                onChange={e => setManualInstructions(e.target.value)}
                placeholder="Instructions (one per line)"
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal resize-y"
              />
              <input
                type="text"
                value={manualTags}
                onChange={e => setManualTags(e.target.value)}
                placeholder="Meal: breakfast, lunch, or dinner"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50"
              >
                {loading ? 'Adding...' : 'Add Recipe'}
              </button>
            </form>
          </div>
        )}

        {/* Recipe list */}
        <div>
          <h2 className="font-display text-xl font-bold text-charcoal mb-4">
            All Recipes ({recipes.length})
          </h2>
          {recipesLoading ? (
            <p className="text-gray-400">Loading...</p>
          ) : recipes.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-md p-8 text-center">
              <p className="text-gray-400 text-lg mb-2">No recipes yet</p>
              <p className="text-gray-300 text-sm">
                Paste a recipe URL above to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-charcoal truncate">
                      {recipe.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      {recipe.sourceName && (
                        <span className="text-xs text-gray-400">
                          {recipe.sourceName}
                        </span>
                      )}
                      {recipe.tags?.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] uppercase bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(recipe.id)}
                    className="text-sm text-red-400 hover:text-red-600 transition-colors shrink-0"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
