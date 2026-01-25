import { ScannedIngredient } from '@/types/recipeScanner';

// Map of common unit variations to our standard units from unitConversion.ts
const UNIT_ALIASES: Record<string, string> = {
  // Volume - Metric
  milliliter: 'mL',
  milliliters: 'mL',
  ml: 'mL',
  liter: 'L',
  liters: 'L',
  l: 'L',

  // Volume - US/Imperial
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsp: 'tsp',
  tsps: 'tsp',
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsp: 'tbsp',
  tbsps: 'tbsp',
  tbs: 'tbsp',
  'fluid ounce': 'fl oz',
  'fluid ounces': 'fl oz',
  'fl oz': 'fl oz',
  'fl. oz.': 'fl oz',
  'fl. oz': 'fl oz',
  cup: 'cup',
  cups: 'cup',
  pint: 'pint',
  pints: 'pint',
  pt: 'pint',
  quart: 'quart',
  quarts: 'quart',
  qt: 'quart',
  gallon: 'gallon',
  gallons: 'gallon',
  gal: 'gallon',

  // Weight - Metric
  milligram: 'mg',
  milligrams: 'mg',
  mg: 'mg',
  gram: 'g',
  grams: 'g',
  g: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  kg: 'kg',

  // Weight - US/Imperial
  ounce: 'oz',
  ounces: 'oz',
  oz: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lb: 'lb',
  lbs: 'lb',

  // Count
  piece: 'piece',
  pieces: 'piece',
  pc: 'piece',
  pcs: 'piece',
  item: 'item',
  items: 'item',
  whole: 'whole',

  // Other
  pinch: 'pinch',
  pinches: 'pinch',
  dash: 'dash',
  dashes: 'dash',
};

// All known unit words (for detection)
const ALL_UNIT_WORDS = new Set([
  ...Object.keys(UNIT_ALIASES),
  // Additional unit-like words that indicate this is an ingredient line
  'bunch', 'bunches', 'head', 'heads', 'clove', 'cloves',
  'stalk', 'stalks', 'sprig', 'sprigs', 'slice', 'slices',
  'can', 'cans', 'jar', 'jars', 'package', 'packages', 'pkg',
  'bag', 'bags', 'box', 'boxes', 'stick', 'sticks',
  'large', 'medium', 'small',
]);

// Unicode fraction map
const UNICODE_FRACTIONS: Record<string, number> = {
  '\u00BC': 0.25, // ¼
  '\u00BD': 0.5, // ½
  '\u00BE': 0.75, // ¾
  '\u2150': 0.142857, // ⅐
  '\u2151': 0.111111, // ⅑
  '\u2152': 0.1, // ⅒
  '\u2153': 0.333333, // ⅓
  '\u2154': 0.666667, // ⅔
  '\u2155': 0.2, // ⅕
  '\u2156': 0.4, // ⅖
  '\u2157': 0.6, // ⅗
  '\u2158': 0.8, // ⅘
  '\u2159': 0.166667, // ⅙
  '\u215A': 0.833333, // ⅚
  '\u215B': 0.125, // ⅛
  '\u215C': 0.375, // ⅜
  '\u215D': 0.625, // ⅝
  '\u215E': 0.875, // ⅞
};

// Regex for quantity at start of line
// Matches: 1, 1.5, 1/2, 1 1/2, 2-3, ½, 1½, ¾
const QUANTITY_REGEX =
  /^([\u00BC-\u00BE\u2150-\u215E]|\d+\s*[\u00BC-\u00BE\u2150-\u215E]|\d+\/\d+|\d+\.\d+|\d+\s+\d+\/\d+|\d+-\d+|\d+)\s*/;

// Common food words that help identify ingredient lines
const FOOD_KEYWORDS = new Set([
  // Proteins
  'chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'shrimp', 'turkey', 'lamb',
  'bacon', 'sausage', 'ham', 'egg', 'eggs', 'tofu',
  // Dairy
  'milk', 'butter', 'cheese', 'cream', 'yogurt', 'sour',
  // Grains/Baking
  'flour', 'sugar', 'salt', 'pepper', 'rice', 'pasta', 'bread', 'oats', 'yeast',
  'baking', 'powder', 'soda', 'cornstarch',
  // Produce
  'onion', 'onions', 'garlic', 'tomato', 'tomatoes', 'potato', 'potatoes',
  'carrot', 'carrots', 'celery', 'lettuce', 'spinach', 'broccoli', 'pepper', 'peppers',
  'lemon', 'lime', 'orange', 'apple', 'banana', 'berries', 'mushroom', 'mushrooms',
  // Oils/Condiments
  'oil', 'olive', 'vegetable', 'canola', 'vinegar', 'soy', 'sauce', 'mayo', 'mayonnaise',
  'mustard', 'ketchup', 'honey', 'maple', 'syrup',
  // Spices/Herbs
  'vanilla', 'cinnamon', 'paprika', 'cumin', 'oregano', 'basil', 'thyme', 'rosemary',
  'parsley', 'cilantro', 'dill', 'bay', 'nutmeg', 'ginger', 'turmeric',
  // Liquids
  'water', 'broth', 'stock', 'wine', 'juice',
  // Nuts/Seeds
  'almond', 'almonds', 'walnut', 'walnuts', 'peanut', 'peanuts', 'sesame',
  // Other common
  'chocolate', 'cocoa', 'beans', 'lentils', 'chickpeas', 'corn', 'peas',
]);

// Words/patterns that indicate this is NOT an ingredient (instruction text)
const INSTRUCTION_INDICATORS = [
  /\b(preheat|bake|cook|stir|mix|combine|add|pour|place|remove|let|allow|until|minutes?|hours?|degrees?|oven|pan|bowl|whisk|beat|fold|knead|rise|refrigerat|cool|warm|heat|boil|simmer|fry|saut[eé]|roast|grill|broil|slice|chop|dice|mince|cut|drain|rinse|set aside|covered?|uncovered)\b/i,
  /\bstep\s*\d/i,
  /^\d+\.\s*[A-Z]/,  // Numbered instructions like "1. Preheat"
  /\b(desired|optional|needed|adjust|to taste)\s*[,.]?\s*$/i,  // Endings like "as desired"
  /\b(the|this|that|these|those|your|into|onto|over|from)\b/i,  // Common instruction words
  /\b(process|processor|running|about|seconds?)\b/i,
];

/**
 * Check if a line looks like an instruction rather than an ingredient
 */
function looksLikeInstruction(line: string): boolean {
  return INSTRUCTION_INDICATORS.some(pattern => pattern.test(line));
}

/**
 * Check if a line contains food-related keywords
 */
function containsFoodKeyword(line: string): boolean {
  const words = line.toLowerCase().split(/\s+/);
  return words.some(word => FOOD_KEYWORDS.has(word.replace(/[^a-z]/g, '')));
}

/**
 * Check if line starts with a quantity followed by a unit
 */
function hasQuantityAndUnit(line: string): { quantity: string; unit: string; rest: string } | null {
  const qtyMatch = line.match(QUANTITY_REGEX);
  if (!qtyMatch) return null;

  const afterQty = line.slice(qtyMatch[0].length);
  const words = afterQty.split(/\s+/);

  if (words.length === 0) return null;

  // Check for single-word unit
  const firstWord = words[0].toLowerCase().replace(/[.,;:()]/g, '');
  if (ALL_UNIT_WORDS.has(firstWord)) {
    const standardUnit = UNIT_ALIASES[firstWord];
    return {
      quantity: qtyMatch[1],
      unit: standardUnit || '', // Empty string if not a standard unit (like "cloves")
      rest: words.slice(1).join(' ').trim(),
    };
  }

  // Check for two-word unit (e.g., "fl oz", "fluid ounces")
  if (words.length > 1) {
    const twoWord = `${words[0]} ${words[1]}`.toLowerCase().replace(/[.,;:()]/g, '');
    if (UNIT_ALIASES[twoWord]) {
      return {
        quantity: qtyMatch[1],
        unit: UNIT_ALIASES[twoWord],
        rest: words.slice(2).join(' ').trim(),
      };
    }
  }

  return null;
}

/**
 * Normalize quantity string to a decimal number string.
 */
function normalizeQuantity(raw: string): string | null {
  const trimmed = raw.trim();

  // Handle unicode fractions (e.g., ½, ¼)
  if (trimmed.length === 1 && UNICODE_FRACTIONS[trimmed]) {
    return UNICODE_FRACTIONS[trimmed].toString();
  }

  // Handle mixed unicode fractions (e.g., 1½)
  const unicodeMixedMatch = trimmed.match(/^(\d+)\s*([\u00BC-\u00BE\u2150-\u215E])$/);
  if (unicodeMixedMatch) {
    const whole = parseInt(unicodeMixedMatch[1]);
    const fraction = UNICODE_FRACTIONS[unicodeMixedMatch[2]] || 0;
    return (whole + fraction).toString();
  }

  // Handle mixed fractions like "1 1/2"
  const mixedMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const denom = parseInt(mixedMatch[3]);
    if (denom === 0) return null;
    return (whole + num / denom).toString();
  }

  // Handle simple fractions like "1/2"
  const fractionMatch = trimmed.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1]);
    const denom = parseInt(fractionMatch[2]);
    if (denom === 0) return null;
    return (num / denom).toString();
  }

  // Handle ranges like "2-3" - take the lower bound
  const rangeMatch = trimmed.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return rangeMatch[1];
  }

  // Handle simple numbers and decimals
  const num = parseFloat(trimmed);
  if (!isNaN(num)) {
    return num.toString();
  }

  return null;
}

/**
 * Clean up ingredient name by removing common noise.
 */
function cleanIngredientName(name: string): string {
  return (
    name
      // Remove leading "of" (e.g., "of bread flour" -> "bread flour")
      .replace(/^of\s+/i, '')
      // Remove trailing punctuation
      .replace(/[,;:.]+$/, '')
      // Remove parenthetical notes like "(optional)" or "(5½ ounces)"
      .replace(/\s*\([^)]*\)\s*/g, ' ')
      // Remove common trailing descriptors
      .replace(/,?\s*(optional|to taste|as needed|for garnish|plus extra|plus more)$/i, '')
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Parse a single line of text to extract ingredient information.
 * STRICT: Only accepts lines that clearly look like ingredients.
 */
export function parseIngredientLine(line: string): ScannedIngredient | null {
  const trimmed = line.trim();

  // Skip empty or very short lines
  if (!trimmed || trimmed.length < 3) return null;

  // Skip lines that look like instructions
  if (looksLikeInstruction(trimmed)) return null;

  // STRICT REQUIREMENT: Line must have quantity + unit pattern
  const parsed = hasQuantityAndUnit(trimmed);

  if (parsed && parsed.rest.length >= 2) {
    // We have a valid quantity + unit + ingredient name
    const normalizedQty = normalizeQuantity(parsed.quantity);
    const name = cleanIngredientName(parsed.rest);

    if (name.length < 2) return null;

    // Final check: the remaining text should look like food, not instructions
    if (looksLikeInstruction(name)) return null;

    return {
      name,
      quantity: normalizedQty || undefined,
      unit: parsed.unit || undefined,
      originalLine: trimmed,
      confidence: 'high',
    };
  }

  // FALLBACK: If no quantity+unit, only accept if it contains clear food keywords
  // and is short (likely just an ingredient name)
  if (containsFoodKeyword(trimmed) && trimmed.split(/\s+/).length <= 5) {
    // Check it's not instruction-like
    if (looksLikeInstruction(trimmed)) return null;

    const name = cleanIngredientName(trimmed);
    if (name.length < 2) return null;

    return {
      name,
      originalLine: trimmed,
      confidence: 'medium',
    };
  }

  // Reject everything else
  return null;
}

/**
 * Parse full OCR text to extract all ingredients.
 */
export function parseRecipeText(ocrText: string): ScannedIngredient[] {
  const lines = ocrText.split('\n');
  const ingredients: ScannedIngredient[] = [];

  for (const line of lines) {
    const parsed = parseIngredientLine(line);
    if (parsed) {
      ingredients.push(parsed);
    }
  }

  return ingredients;
}

/**
 * Try to extract the recipe name from OCR text.
 * Looks for the first line that appears to be a title (not an ingredient).
 */
export function extractRecipeName(ocrText: string): string {
  const lines = ocrText.split('\n').filter((l) => l.trim());

  for (const line of lines.slice(0, 5)) {
    const trimmed = line.trim();

    // Skip if it looks like an ingredient (starts with number/fraction)
    if (QUANTITY_REGEX.test(trimmed)) continue;

    // Skip if it's a section header
    if (/^(ingredients?|instructions?|directions?|steps?|method):?\s*$/i.test(trimmed)) continue;

    // Skip very short lines
    if (trimmed.length < 3) continue;

    // Skip if it looks like instructions
    if (looksLikeInstruction(trimmed)) continue;

    // This is likely the recipe name
    return trimmed;
  }

  return '';
}
