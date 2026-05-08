'use client';

import Link from 'next/link';
import type { Recipe } from '@/lib/store';

interface Props {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function RecipeCard({ recipe, onDelete, showDelete }: Props) {
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete || !confirm(`Remove "${recipe.title}"?`)) return;
    onDelete(recipe.id);
  };

  return (
    <Link
      href={`/recipe/${recipe.id}`}
      className="block bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-cream-dark hover:border-sage/20 hover:shadow-md transition-all group"
    >
      {/* Image */}
      {recipe.imageUrl && (
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-charcoal leading-tight group-hover:text-terracotta transition-colors">
            {recipe.title}
          </h3>
          {showDelete && onDelete && (
            <button
              onClick={handleDelete}
              className="shrink-0 text-sm text-red-400 hover:text-red-600 transition-colors"
              title="Remove recipe"
            >
              ✕
            </button>
          )}
        </div>

        {/* Source */}
        {recipe.sourceName && (
          <span className="text-xs text-sage mt-1 inline-block">
            via {recipe.sourceName}
          </span>
        )}

        {/* Meta */}
        <div className="flex flex-wrap gap-2 mt-3">
          {recipe.prepTime && (
            <span className="text-xs bg-sage/10 text-sage-dark px-2 py-1 rounded-full">
              Prep: {recipe.prepTime}
            </span>
          )}
          {recipe.cookTime && (
            <span className="text-xs bg-sage/10 text-sage-dark px-2 py-1 rounded-full">
              Cook: {recipe.cookTime}
            </span>
          )}
          {recipe.servings && (
            <span className="text-xs bg-terracotta/10 text-terracotta px-2 py-1 rounded-full">
              {recipe.servings} servings
            </span>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] uppercase tracking-wider bg-gray-100 text-gray-500 px-2 py-0.5 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Description — fully shown now */}
        {recipe.description && (
          <p className="text-sm text-gray-500 mt-3 leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* CTA */}
        <div className="mt-4 text-sm font-medium text-terracotta group-hover:text-terracotta/80 transition-colors">
          View recipe →
        </div>
      </div>
    </Link>
  );
}
