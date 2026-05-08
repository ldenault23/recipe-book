'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import type { Recipe } from '@/lib/store';
import type { NutritionInfo } from '@/lib/nutrition';

export default function RecipeDetailPage() {
  const params = useParams();
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [nutrition, setNutrition] = useState<NutritionInfo | null>(null);
  const [nutritionLoading, setNutritionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/recipes/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        setRecipe(data.title ? data : null);
        // Fetch nutrition
        setNutritionLoading(true);
        fetch(`/api/nutrition/${params.id}`)
          .then((r) => r.json())
          .then((n) => {
            if (n.calories) setNutrition(n);
          })
          .catch(() => {})
          .finally(() => setNutritionLoading(false));
      })
      .catch(() => setRecipe(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse text-gray-300 text-lg">Loading...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-3xl mb-4">😕</p>
          <h1 className="font-display text-2xl font-bold text-charcoal mb-2">
            Recipe not found
          </h1>
          <Link href="/" className="text-terracotta hover:text-terracotta/80 transition-colors">
            ← Back to recipe book
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero image */}
      {recipe.imageUrl && (
        <div className="relative w-full h-64 md:h-96 overflow-hidden">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-sage-dark hover:text-sage transition-colors mb-6"
        >
          ← Back to recipe book
        </Link>

        {/* Title & meta */}
        <h1 className="font-bold text-3xl md:text-4xl text-warm mb-3">
          {recipe.title}
        </h1>

        {recipe.sourceName && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-sage-dark hover:text-sage transition-colors"
          >
            via {recipe.sourceName} ↗
          </a>
        )}

        {/* Meta pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {recipe.prepTime && (
            <span className="text-xs bg-sage/10 text-sage-dark px-3 py-1.5 rounded-full font-medium">
              Prep: {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span className="text-xs bg-sage/10 text-sage-dark px-3 py-1.5 rounded-full font-medium">
              Cook: {recipe.cookTime}
            </span>
          )}
          {recipe.totalTime && (
            <span className="text-xs bg-sage/10 text-sage-dark px-3 py-1.5 rounded-full font-medium">
              Total: {recipe.totalTime}
            </span>
          )}
          {recipe.servings && (
            <span className="text-xs bg-terracotta/10 text-terracotta px-3 py-1.5 rounded-full font-medium">
              {recipe.servings} servings
            </span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {recipe.tags.map((tag) => (
              <span key={tag} className="text-[10px] uppercase tracking-wider bg-white border border-gray-200 text-gray-500 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        {recipe.description && (
          <p className="text-gray-500 mt-6 leading-relaxed">{recipe.description}</p>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-display text-sm font-bold text-charcoal mb-2">Notes</h3>
            <p className="text-sm text-gray-500 italic">{recipe.notes}</p>
          </div>
        )}

        {/* Nutrition */}
        {nutritionLoading && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <p className="text-sm text-gray-400">Loading nutrition info...</p>
          </div>
        )}
        {nutrition && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-display text-sm font-bold text-charcoal mb-3">Nutrition per serving</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <NutritionBadge label="Calories" value={nutrition.calories} color="terracotta" />
              <NutritionBadge label="Protein" value={nutrition.protein} color="sage" />
              <NutritionBadge label="Carbs" value={nutrition.carbs} color="amber" />
              <NutritionBadge label="Fat" value={nutrition.fat} color="rose" />
            </div>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <div className="mt-8">
            <h2 className="font-display text-xl font-bold text-charcoal mb-4">
              Ingredients
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <li key={i} className="flex items-start gap-3 text-gray-600 py-1 border-b border-gray-50 last:border-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta mt-2 shrink-0" />
                    <span>{ing}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Instructions */}
        {recipe.instructions.length > 0 && (
          <div className="mt-8 mb-12">
            <h2 className="font-display text-xl font-bold text-charcoal mb-4">
              Instructions
            </h2>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <ol className="space-y-5">
                {recipe.instructions.map((step, i) => (
                  <li key={i} className="flex gap-4">
                    <span className="w-7 h-7 rounded-full bg-sage text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-600 leading-relaxed pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* Date added */}
        <p className="text-xs text-gray-300 text-center pb-8">
          Added {new Date(recipe.dateAdded).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

function NutritionBadge({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    terracotta: 'bg-terracotta/10 text-terracotta',
    sage: 'bg-sage/10 text-sage-dark',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-600',
  };

  return (
    <div className={`rounded-xl p-3 text-center ${colors[color] || colors.sage}`}>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[10px] uppercase tracking-wider font-medium mt-0.5">{label}</div>
    </div>
  );
}
