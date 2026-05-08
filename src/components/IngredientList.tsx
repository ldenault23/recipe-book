'use client';

import { useUnit } from '@/lib/UnitContext';
import { convertIngredient } from '@/lib/measurements';

interface Props {
  ingredients: string[];
  compact?: boolean; // fewer items shown
}

export default function IngredientList({ ingredients, compact }: Props) {
  const { unit, toggleUnit } = useUnit();

  const displayIngredients = compact ? ingredients.slice(0, 4) : ingredients;
  const hasMore = compact && ingredients.length > 4;

  return (
    <div>
      {/* Toggle */}
      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={toggleUnit}
          className="inline-flex items-center rounded-full bg-cream-dark/60 p-0.5 text-xs font-medium"
          title={`Switch to ${unit === 'metric' ? 'US' : 'Metric'}`}
        >
          <span
            className={`px-2.5 py-1 rounded-full transition-colors ${
              unit === 'us'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            US
          </span>
          <span
            className={`px-2.5 py-1 rounded-full transition-colors ${
              unit === 'metric'
                ? 'bg-white text-charcoal shadow-sm'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            Metric
          </span>
        </button>
      </div>

      {/* Ingredient list */}
      <ul className={compact ? 'space-y-1' : 'space-y-2'}>
        {displayIngredients.map((ing, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 text-gray-600 ${
              compact ? 'text-xs py-0.5' : 'text-sm py-1 border-b border-gray-50 last:border-0'
            }`}
          >
            {!compact && (
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta mt-2 shrink-0" />
            )}
            <span>
              {convertIngredient(ing, unit)}
            </span>
          </li>
        ))}
        {hasMore && (
          <li className="text-xs text-gray-400 italic">
            +{ingredients.length - 4} more ingredients
          </li>
        )}
      </ul>
    </div>
  );
}
