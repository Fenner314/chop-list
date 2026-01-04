// Common units of measurement grouped by type
export const UNITS = {
  // Volume - Metric
  MILLILITER: 'mL',
  LITER: 'L',

  // Volume - US/Imperial
  TEASPOON: 'tsp',
  TABLESPOON: 'tbsp',
  FLUID_OUNCE: 'fl oz',
  CUP: 'cup',
  PINT: 'pint',
  QUART: 'quart',
  GALLON: 'gallon',

  // Weight - Metric
  GRAM: 'g',
  KILOGRAM: 'kg',
  MILLIGRAM: 'mg',

  // Weight - US/Imperial
  OUNCE: 'oz',
  POUND: 'lb',

  // Count
  PIECE: 'piece',
  ITEM: 'item',
  WHOLE: 'whole',

  // Other
  PINCH: 'pinch',
  DASH: 'dash',
} as const;

// Unit groups for the picker
export const UNIT_GROUPS: Array<{ label: string; options: Array<{ value: string; label: string }> }> = [
  {
    label: 'Volume (Metric)',
    options: [
      { value: UNITS.MILLILITER, label: 'mL (Milliliter)' },
      { value: UNITS.LITER, label: 'L (Liter)' },
    ],
  },
  {
    label: 'Volume (US)',
    options: [
      { value: UNITS.TEASPOON, label: 'tsp (Teaspoon)' },
      { value: UNITS.TABLESPOON, label: 'Tbsp (Tablespoon)' },
      { value: UNITS.FLUID_OUNCE, label: 'fl oz (Fluid Ounce)' },
      { value: UNITS.CUP, label: 'Cup' },
      { value: UNITS.PINT, label: 'Pint' },
      { value: UNITS.QUART, label: 'Quart' },
      { value: UNITS.GALLON, label: 'Gallon' },
    ],
  },
  {
    label: 'Weight (Metric)',
    options: [
      { value: UNITS.MILLIGRAM, label: 'mg (Milligram)' },
      { value: UNITS.GRAM, label: 'g (Gram)' },
      { value: UNITS.KILOGRAM, label: 'kg (Kilogram)' },
    ],
  },
  {
    label: 'Weight (US)',
    options: [
      { value: UNITS.OUNCE, label: 'oz (Ounce)' },
      { value: UNITS.POUND, label: 'lb (Pound)' },
    ],
  },
  {
    label: 'Count',
    options: [
      { value: UNITS.PIECE, label: 'Piece' },
      { value: UNITS.ITEM, label: 'Item' },
      { value: UNITS.WHOLE, label: 'Whole' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: UNITS.PINCH, label: 'Pinch' },
      { value: UNITS.DASH, label: 'Dash' },
    ],
  },
];

// Flat list of all units for quick selection
export const ALL_UNITS: Array<{ value: string; label: string }> = UNIT_GROUPS.flatMap(group => group.options);

// Conversion factors to base units (teaspoon for volume, gram for weight)
const VOLUME_CONVERSIONS: Record<string, number> = {
  [UNITS.TEASPOON]: 1,
  [UNITS.TABLESPOON]: 3,
  [UNITS.FLUID_OUNCE]: 6,
  [UNITS.CUP]: 48,
  [UNITS.PINT]: 96,
  [UNITS.QUART]: 192,
  [UNITS.GALLON]: 768,
  [UNITS.MILLILITER]: 0.202884, // 1 mL = 0.202884 tsp
  [UNITS.LITER]: 202.884, // 1 L = 202.884 tsp
};

const WEIGHT_CONVERSIONS: Record<string, number> = {
  [UNITS.MILLIGRAM]: 0.001,
  [UNITS.GRAM]: 1,
  [UNITS.KILOGRAM]: 1000,
  [UNITS.OUNCE]: 28.3495,
  [UNITS.POUND]: 453.592,
};

// Count-based units (these can only be subtracted from themselves)
const COUNT_UNITS: string[] = [UNITS.PIECE, UNITS.ITEM, UNITS.WHOLE];

// Special units that can't be converted
const SPECIAL_UNITS: string[] = [UNITS.PINCH, UNITS.DASH];

/**
 * Check if two units are compatible for arithmetic operations (add/subtract)
 */
export function areUnitsCompatible(unit1?: string, unit2?: string): boolean {
  // If either unit is missing, treat as compatible
  if (!unit1 || !unit2) return true;

  // Same unit is always compatible
  if (unit1 === unit2) return true;

  // Count units can only work with same unit
  if (COUNT_UNITS.includes(unit1) || COUNT_UNITS.includes(unit2)) {
    return unit1 === unit2;
  }

  // Special units can only work with same unit
  if (SPECIAL_UNITS.includes(unit1) || SPECIAL_UNITS.includes(unit2)) {
    return unit1 === unit2;
  }

  // Check if both are volume units
  const bothVolume = unit1 in VOLUME_CONVERSIONS && unit2 in VOLUME_CONVERSIONS;
  if (bothVolume) return true;

  // Check if both are weight units
  const bothWeight = unit1 in WEIGHT_CONVERSIONS && unit2 in WEIGHT_CONVERSIONS;
  if (bothWeight) return true;

  return false;
}

/**
 * Convert a quantity from one unit to another
 * Returns null if conversion is not possible
 */
export function convertUnit(
  quantity: number,
  fromUnit?: string,
  toUnit?: string
): number | null {
  // If units are the same or missing, no conversion needed
  if (!fromUnit || !toUnit || fromUnit === toUnit) {
    return quantity;
  }

  // Check if units are compatible
  if (!areUnitsCompatible(fromUnit, toUnit)) {
    return null;
  }

  // Try volume conversion
  if (fromUnit in VOLUME_CONVERSIONS && toUnit in VOLUME_CONVERSIONS) {
    const baseQuantity = quantity * VOLUME_CONVERSIONS[fromUnit];
    return baseQuantity / VOLUME_CONVERSIONS[toUnit];
  }

  // Try weight conversion
  if (fromUnit in WEIGHT_CONVERSIONS && toUnit in WEIGHT_CONVERSIONS) {
    const baseQuantity = quantity * WEIGHT_CONVERSIONS[fromUnit];
    return baseQuantity / WEIGHT_CONVERSIONS[toUnit];
  }

  return null;
}

/**
 * Subtract recipe quantity from pantry quantity, handling unit conversion
 * Returns the new pantry quantity in the pantry's original unit, or null if incompatible
 */
export function subtractQuantities(
  pantryQty: number,
  pantryUnit: string | undefined,
  recipeQty: number,
  recipeUnit: string | undefined
): number | null {
  // Check compatibility
  if (!areUnitsCompatible(pantryUnit, recipeUnit)) {
    return null;
  }

  // Convert recipe quantity to pantry unit
  const convertedRecipeQty = convertUnit(recipeQty, recipeUnit, pantryUnit);

  if (convertedRecipeQty === null) {
    return null;
  }

  return pantryQty - convertedRecipeQty;
}

/**
 * Pluralize a unit based on quantity
 */
export function pluralizeUnit(unit: string, quantity: number): string {
  // Units that don't need pluralization
  const noPlurals: string[] = [
    UNITS.MILLILITER,
    UNITS.LITER,
    UNITS.FLUID_OUNCE,
    UNITS.GRAM,
    UNITS.KILOGRAM,
    UNITS.MILLIGRAM,
    UNITS.OUNCE,
  ];

  if (noPlurals.includes(unit)) {
    return unit;
  }

  // Handle special plurals
  const specialPlurals: Record<string, string> = {
    [UNITS.PINCH]: 'pinches',
    [UNITS.DASH]: 'dashes',
  };

  if (quantity === 1) {
    return unit;
  }

  // Check for special plural
  if (specialPlurals[unit]) {
    return specialPlurals[unit];
  }

  // Default: add 's'
  return `${unit}s`;
}

/**
 * Format a quantity with unit for display, handling plurality
 */
export function formatQuantityWithUnit(quantity: string, unit?: string): string {
  if (!unit) {
    if (quantity == "1") return "";

    return quantity;
  }

  const qty = parseFloat(quantity);
  if (isNaN(qty)) return `${quantity} ${unit}`;

  const pluralUnit = pluralizeUnit(unit, qty);
  return `${quantity} ${pluralUnit}`;
}
