'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Recipe } from '@/lib/store';
import RecipeCard from '@/components/RecipeCard';

const TAGS = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'dessert',
  'quick',
  'vegetarian',
  'chicken',
  'beef',
  'seafood',
  'pasta',
  'soup',
  'salad',
] as const;

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

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

    return result;
  }, [recipes, search, selectedTag]);

  const appUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Collect all tags from recipes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    recipes.forEach((r) => r.tags?.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [recipes]);

  // Printable recipe index (compact version for binder)
  const printableRecipes = useMemo(() => {
    return recipes.map((r) => ({
      title: r.title,
      sourceUrl: r.sourceUrl,
      sourceName: r.sourceName,
      tags: r.tags,
      prepTime: r.prepTime,
      cookTime: r.cookTime,
    }));
  }, [recipes]);

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-charcoal">
                🥘 Meal Prep
                <span className="block text-sage text-2xl md:text-3xl mt-1">
                  Recipe Book
                </span>
              </h1>
              <p className="text-gray-400 mt-2 text-sm">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} saved
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                {showQr ? 'Hide QR' : '📱 QR Code'}
              </button>
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
        {/* QR Code section */}
        {showQr && (
          <div className="bg-white rounded-2xl shadow-md p-6 mb-6 text-center">
            <h2 className="font-display text-lg font-bold text-charcoal mb-3">
              Scan for the Recipe Book
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Print this QR code and put it on your binder cover.
            </p>
            <div className="flex justify-center">
              {/* We render QR code with an iframe for simplicity; 
                  the client component handles it */}
              <QrCodeSvg url={appUrl} />
            </div>
            <p className="text-xs text-gray-300 mt-3 break-all">{appUrl}</p>
          </div>
        )}

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search recipes, ingredients..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-terracotta/30 text-charcoal bg-white"
          />
          <select
            value={selectedTag || ''}
            onChange={(e) => setSelectedTag(e.target.value || null)}
            className="px-4 py-3 rounded-xl border border-gray-200 bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-terracotta/30"
          >
            <option value="">All categories</option>
            {TAGS.map((tag) => (
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
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  selectedTag === tag
                    ? 'bg-terracotta text-white'
                    : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-200'
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
                  This recipe book is waiting for its first meal prep recipe!
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

      {/* Footer */}
      <footer className="text-center py-8 text-gray-300 text-xs">
        Recipe Book — scan the QR code on your binder to view all recipes
      </footer>
    </div>
  );
}

// Inline QR code component (client-only to avoid SSR issues)
import dynamic from 'next/dynamic';

const QRCodeSVG = dynamic(
  () => import('qrcode.react').then((mod) => ({ default: mod.QRCodeSVG })),
  { ssr: false, loading: () => <div style={{ width: 200, height: 200 }} className="bg-gray-100 rounded-xl animate-pulse" /> }
);

function QrCodeSvg({ url, size = 200 }: { url: string; size?: number }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md inline-block">
      <QRCodeSVG
        value={url}
        size={size}
        level="M"
        includeMargin
        className="rounded-lg"
      />
    </div>
  );
}
