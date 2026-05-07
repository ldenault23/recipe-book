'use client';

import { useState } from 'react';
import type { Recipe } from '@/lib/store';

interface Props {
  recipe: Recipe;
  onDelete?: (id: string) => void;
  showDelete?: boolean;
}

export default function RecipeCard({ recipe, onDelete, showDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!onDelete || !confirm(`Remove "${recipe.title}"?`)) return;
    setDeleting(true);
    onDelete(recipe.id);
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Image */}
      {recipe.imageUrl && (
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl font-bold text-charcoal leading-tight">
            {recipe.title}
          </h3>
          {showDelete && onDelete && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="shrink-0 text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
              title="Remove recipe"
            >
              ✕
            </button>
          )}
        </div>

        {/* Source */}
        {recipe.sourceName && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-sage hover:text-sage-dark transition-colors mt-1 inline-block"
          >
            via {recipe.sourceName} ↗
          </a>
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

        {/* Description */}
        {recipe.description && (
          <p className="text-sm text-gray-500 mt-3 line-clamp-2">
            {recipe.description}
          </p>
        )}

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-3 text-sm text-terracotta hover:text-terracotta/80 font-medium transition-colors"
        >
          {expanded ? 'Show less ▲' : 'View recipe ▼'}
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="mt-4 space-y-4 border-t pt-4">
            {/* Ingredients */}
            {recipe.ingredients.length > 0 && (
              <div>
                <h4 className="font-display text-sm font-bold text-charcoal mb-2">
                  Ingredients
                </h4>
                <ul className="space-y-1">
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-terracotta mt-1.5 shrink-0">•</span>
                      {ing}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {recipe.instructions.length > 0 && (
              <div>
                <h4 className="font-display text-sm font-bold text-charcoal mb-2">
                  Instructions
                </h4>
                <ol className="space-y-2 list-decimal list-inside">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="text-sm text-gray-600 pl-2">
                      <span className="ml-1">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Notes */}
            {recipe.notes && (
              <div>
                <h4 className="font-display text-sm font-bold text-charcoal mb-1">
                  Notes
                </h4>
                <p className="text-sm text-gray-500 italic">{recipe.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
