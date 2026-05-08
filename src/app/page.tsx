'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import type { Recipe } from '@/lib/store';
import RecipeCard from '@/components/RecipeCard';
import ChatWidget from '@/components/ChatWidget';

const MEALS = ['breakfast', 'lunch', 'dinner'] as const;

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/recipes')
      .then((res) => res.json())
      .then((data) => {
        setRecipes(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        // ignore
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = recipes;

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.description?.toLowerCase().includes(query) ||
          r.ingredients.some((i) => i.toLowerCase().includes(query))
      );
    }

    if (selectedTag) {
      result = result.filter((r) => r.tags?.includes(selectedTag));
    }

    // Sort by date added (newest first)
    result = [...result].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime());

    return result;
  }, [recipes, search, selectedTag]);

  // Collect all tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [recipes]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <header className="border-b border-cream-dark">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <div className="relative h-16 md:h-20 w-64 md:w-80">
                <Image
                  src="/logo.png"
                  alt="Olivia's Recipe Book"
                  fill
                  className="object-contain object-left"
                  priority
                  unoptimized
                />
              </div>
              <p className="text-gray-400 mt-2 text-sm">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <div className="flex gap-3">
              <a
                href="/admin"
                className="text-sm px-4 py-2 rounded-xl bg-sage text-white hover:bg-sage-dark transition-colors"
              >
                Manage
              </a>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients..."
            className="flex-1 px-4 py-3 rounded-2xl border border-cream-dark bg-white/60 focus:outline-none focus:ring-2 focus:ring-sage/20 text-warm placeholder-gray-400"
          />
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="px-4 py-3 rounded-2xl border border-cream-dark bg-white/60 text-warm focus:outline-none focus:ring-2 focus:ring-sage/20"
          >
            <option value="">All categories</option>
            {MEALS.map((tag) => (
              <option key={tag} value={tag}>
                {tag.charAt(0).toUpperCase() + tag.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTag(selectedTag === tag ? null : tag)
                }
                className={`text-xs px-3 py-1.5 rounded-full transition-colors font-medium ${
                  selectedTag === tag
                    ? 'bg-terracotta text-white'
                    : 'bg-white/60 text-gray-500 hover:bg-white border border-cream-dark'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Recipe grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow-md h-64 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            {recipes.length === 0 ? (
              <>
                <p className="text-3xl mb-4">📖</p>
                <h2 className="font-display text-2xl font-bold text-charcoal mb-2">
                  No recipes yet
                </h2>
                <p className="text-gray-400 mb-6">
                  This recipe book is waiting for its first recipe!
                </p>
                <a
                  href="/admin"
                  className="inline-block px-6 py-3 bg-terracotta text-white rounded-xl font-medium hover:bg-terracotta/90 transition-colors"
                >
                  Add Your First Recipe
                </a>
              </>
            ) : (
              <>
                <p className="text-3xl mb-4">🔍</p>
                <h2 className="font-display text-xl font-bold text-charcoal mb-2">
                  No matches
                </h2>
                <p className="text-gray-400">
                  Try a different search or filter.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </div>

      <ChatWidget />
    </div>
  );
}
