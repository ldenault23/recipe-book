/** Parse and convert between metric and US volume/weight measurements. */

export type UnitSystem = 'metric' | 'us';

export interface ParsedIngredient {
  raw: string;
  quantity: number | null;
  unit: string | null;     // normalized key: "cup", "tbsp", "tsp", "oz", "lb", "g", "kg", "ml", "l", etc.
  unitDisplay: string | null; // original unit text
  name: string;
  isConvertible: boolean;
}

// ── Unit definitions ──────────────────────────────────────────
const US_VOLUME_TO_ML: Record<string, number> = {
  cup: 240,
  cups: 240,
  tablespoon: 15,
  tablespoons: 15,
  tbsp: 15,
  'tblsp.': 15,
  teaspoon: 5,
  teaspoons: 5,
  tsp: 5,
  'fl oz': 29.57,
  'fluid ounce': 29.57,
  'fluid ounces': 29.57,
  pint: 473,
  pints: 473,
  quart: 946,
  quarts: 946,
  gallon: 3785,
  gallons: 3785,
};

const US_WEIGHT_TO_G: Record<string, number> = {
  oz: 28.35,
  ounce: 28.35,
  ounces: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  pounds: 453.6,
};

const METRIC_VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  milliliter: 1,
  milliliters: 1,
  millilitre: 1,
  millilitres: 1,
  l: 1000,
  liter: 1000,
  liters: 1000,
  litre: 1000,
  litres: 1000,
  dl: 100,
  deciliter: 100,
  deciliters: 100,
  cl: 10,
  centiliter: 10,
  centiliters: 10,
};

const METRIC_WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  kg: 1000,
  kilogram: 1000,
  kilograms: 1000,
  mg: 0.001,
  milligram: 0.001,
  milligrams: 0.001,
};

/** Normalize a unit string to its canonical key */
function normalizeUnit(raw: string): { key: string; display: string } | null {
  const cleaned = raw.toLowerCase().replace(/[.\s]+$/, '').trim();
  if (!cleaned) return null;

  // Try exact match first
  const allUnits = {
    ...US_VOLUME_TO_ML,
    ...US_WEIGHT_TO_G,
    ...METRIC_VOLUME_TO_ML,
    ...METRIC_WEIGHT_TO_G,
  };
  if (allUnits[cleaned] !== undefined) return { key: cleaned, display: raw };

  // Try matching without trailing 's'
  const singular = cleaned.replace(/s$/, '');
  if (singular !== cleaned && allUnits[singular] !== undefined) {
    return { key: singular, display: raw };
  }

  return null;
}

// ── Parsing ────────────────────────────────────────────────────

/**
 * Parse a fraction string like "1/2", "3/4" to a number.
 * Also handles mixed numbers like "1 1/2".
 */
function parseFraction(s: string): number | null {
  // Mixed number: "1 1/2"
  const mixed = s.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1]) + parseInt(mixed[2]) / parseInt(mixed[3]);
  }
  // Simple fraction: "1/2"
  const frac = s.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return parseInt(frac[1]) / parseInt(frac[2]);
  }
  // Unicode fractions: ½ ¼ ¾ ⅓ ⅔ ⅛ ⅜ ⅝ ⅞
  const unicodeFractions: Record<string, number> = {
    '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3,
    '⅔': 2 / 3, '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  };
  if (unicodeFractions[s] !== undefined) return unicodeFractions[s];
  return null;
}

/** Try to parse a number from a string — handles decimals, fractions, mixed. */
function parseNumber(s: string): number | null {
  // Try plain number (integer or decimal)
  const num = parseFloat(s);
  if (!isNaN(num)) return num;
  // Try fraction
  return parseFraction(s);
}

/**
 * Parse an ingredient string into quantity + unit + name.
 * Examples:
 *   "2 cups all-purpose flour" → { qty: 2, unit: "cup", name: "all-purpose flour" }
 *   "1 1/2 tablespoons olive oil" → { qty: 1.5, unit: "tbsp", name: "olive oil" }
 *   "200g sugar" → { qty: 200, unit: "g", name: "sugar" }
 *   "3 cloves garlic" → { qty: 3, unit: null, name: "cloves garlic" }
 *   "Salt to taste" → { qty: null, unit: null, name: "Salt to taste" }
 */
export function parseIngredient(ingredient: string): ParsedIngredient {
  const raw = ingredient.trim();
  if (!raw) {
    return { raw, quantity: null, unit: null, unitDisplay: null, name: raw, isConvertible: false };
  }

  // Pattern: quantity (number or fraction) then optional unit then ingredient name
  // Also handles "200g" (no space between number and unit for metric)

  // Try metric compact form first: "200g sugar", "500ml milk"
  const compactMetric = raw.match(/^([\d.,]+)\s*(g|kg|mg|ml|l|dl|cl)\s+(.+)$/i);
  if (compactMetric) {
    const qty = parseFloat(compactMetric[1].replace(',', '.'));
    const unitKey = compactMetric[2].toLowerCase();
    const norm = normalizeUnit(unitKey);
    return {
      raw,
      quantity: isNaN(qty) ? null : qty,
      unit: norm?.key ?? unitKey,
      unitDisplay: compactMetric[2],
      name: compactMetric[3].trim(),
      isConvertible: norm !== null,
    };
  }

  // Try "200 g sugar" (space between number and unit)
  const spacedMetric = raw.match(/^([\d.,]+)\s+(g|kg|mg|ml|l|dl|cl)\s+(.+)$/i);
  if (spacedMetric) {
    const qty = parseFloat(spacedMetric[1].replace(',', '.'));
    const norm = normalizeUnit(spacedMetric[2].toLowerCase());
    return {
      raw,
      quantity: isNaN(qty) ? null : qty,
      unit: norm?.key ?? spacedMetric[2].toLowerCase(),
      unitDisplay: spacedMetric[2],
      name: spacedMetric[3].trim(),
      isConvertible: norm !== null,
    };
  }

  // Try full pattern: [number or fraction] [unit] [name]
  // Matches: "2 cups flour", "1 1/2 tablespoons oil", "½ cup sugar", "1/4 tsp salt"
  const fullPattern = raw.match(
    /^([\d.,\/\s½¼¾⅓⅔⅛⅜⅝⅞]+?)\s+([a-zA-Z.\s]+?)\s+(.+)$/
  );
  if (fullPattern) {
    const qtyStr = fullPattern[1].trim();
    const unitStr = fullPattern[2].trim();
    const nameStr = fullPattern[3].trim();

    // Try parsing as number + unit
    const qtyParts = qtyStr.split(/\s+/);
    let qty: number | null = null;
    let remainingUnit = unitStr;

    // Check if last part of quantity is actually part of the unit (like "fl oz")
    if (qtyParts.length >= 2) {
      const maybeCombined = qtyParts[qtyParts.length - 1] + ' ' + unitStr.split(/\s+/)[0];
      const normCombined = normalizeUnit(maybeCombined);
      if (normCombined) {
        qty = parseNumber(qtyParts.slice(0, -1).join(' '));
        remainingUnit = maybeCombined + ' ' + unitStr.split(/\s+/).slice(1).join(' ');
      }
    }

    if (qty === null) {
      qty = parseNumber(qtyStr);
    }

    const norm = normalizeUnit(remainingUnit.trim());

    return {
      raw,
      quantity: qty,
      unit: norm?.key ?? remainingUnit.trim().toLowerCase(),
      unitDisplay: remainingUnit.trim(),
      name: nameStr,
      isConvertible: norm !== null && qty !== null,
    };
  }

  // No quantity pattern found — return as-is (e.g., "Salt to taste", "3 cloves garlic")
  return {
    raw,
    quantity: null,
    unit: null,
    unitDisplay: null,
    name: raw,
    isConvertible: false,
  };
}

// ── Conversion ─────────────────────────────────────────────────

function toFraction(decimal: number): string {
  const fractions: [number, string][] = [
    [0.125, '⅛'], [0.25, '¼'], [0.333, '⅓'], [0.375, '⅜'],
    [0.5, '½'], [0.625, '⅝'], [0.667, '⅔'], [0.75, '¾'], [0.875, '⅞'],
  ];
  const whole = Math.floor(decimal);
  const frac = decimal - whole;

  for (const [val, symbol] of fractions) {
    if (Math.abs(frac - val) < 0.02) {
      return whole > 0 ? `${whole} ${symbol}` : symbol;
    }
  }

  // Round to 2 decimal places
  const rounded = Math.round(decimal * 100) / 100;
  return String(rounded);
}

function formatQuantity(value: number): string {
  if (value >= 100) return String(Math.round(value));
  if (value >= 10) return String(Math.round(value * 10) / 10);
  if (value < 1) return toFraction(value);
  return toFraction(value);
}

/** Convert a parsed ingredient to metric display. */
export function toMetric(parsed: ParsedIngredient): string {
  if (!parsed.isConvertible || parsed.quantity === null || !parsed.unit) {
    return parsed.raw;
  }

  const unit = parsed.unit;
  const qty = parsed.quantity;

  // US volume → mL (or L if large)
  if (US_VOLUME_TO_ML[unit] !== undefined) {
    const ml = qty * US_VOLUME_TO_ML[unit];
    if (ml >= 1000) {
      return `${formatQuantity(ml / 1000)} L ${parsed.name}`;
    }
    return `${Math.round(ml)} ml ${parsed.name}`;
  }

  // US weight → g (or kg if large)
  if (US_WEIGHT_TO_G[unit] !== undefined) {
    const grams = qty * US_WEIGHT_TO_G[unit];
    if (grams >= 1000) {
      return `${formatQuantity(grams / 1000)} kg ${parsed.name}`;
    }
    return `${Math.round(grams)} g ${parsed.name}`;
  }

  // Already metric — return as-is
  return parsed.raw;
}

/** Convert a parsed ingredient to US display. */
export function toUS(parsed: ParsedIngredient): string {
  if (!parsed.isConvertible || parsed.quantity === null || !parsed.unit) {
    return parsed.raw;
  }

  const unit = parsed.unit;
  const qty = parsed.quantity;

  // Metric volume → US
  if (METRIC_VOLUME_TO_ML[unit] !== undefined) {
    const totalMl = qty * METRIC_VOLUME_TO_ML[unit];
    if (totalMl >= 946) {
      return `${formatQuantity(totalMl / 946)} qt ${parsed.name}`;
    }
    if (totalMl >= 473) {
      return `${formatQuantity(totalMl / 473)} pt ${parsed.name}`;
    }
    if (totalMl >= 240) {
      return `${formatQuantity(totalMl / 240)} cup${totalMl >= 480 ? 's' : ''} ${parsed.name}`;
    }
    if (totalMl >= 15) {
      return `${formatQuantity(totalMl / 15)} tbsp ${parsed.name}`;
    }
    return `${formatQuantity(totalMl / 5)} tsp ${parsed.name}`;
  }

  // Metric weight → US
  if (METRIC_WEIGHT_TO_G[unit] !== undefined) {
    const totalG = qty * METRIC_WEIGHT_TO_G[unit];
    if (totalG >= 453.6) {
      return `${formatQuantity(totalG / 453.6)} lb ${parsed.name}`;
    }
    return `${formatQuantity(totalG / 28.35)} oz ${parsed.name}`;
  }

  // Already US — return as-is
  return parsed.raw;
}

/** Convert an ingredient string to the target unit system. */
export function convertIngredient(ingredient: string, target: UnitSystem): string {
  const parsed = parseIngredient(ingredient);
  return target === 'metric' ? toMetric(parsed) : toUS(parsed);
}
