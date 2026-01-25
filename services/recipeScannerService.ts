import { ScannedRecipe, ScannedIngredient } from '@/types/recipeScanner';
import { parseRecipeText, extractRecipeName } from '@/utils/ingredientParser';
import { autoCategorizeItem } from '@/utils/categorization';

export interface ScanResult {
  success: boolean;
  recipe?: ScannedRecipe;
  error?: string;
}

/**
 * Process raw OCR text and extract recipe information.
 */
export function processOCRResult(ocrText: string): ScanResult {
  if (!ocrText || ocrText.trim().length < 10) {
    return {
      success: false,
      error: 'Could not read text from image. Please try again with better lighting.',
    };
  }

  const ingredients = parseRecipeText(ocrText);

  if (ingredients.length === 0) {
    return {
      success: false,
      error: 'No ingredients detected. Make sure the recipe ingredients are visible.',
    };
  }

  const name = extractRecipeName(ocrText);

  return {
    success: true,
    recipe: {
      name,
      ingredients,
      rawText: ocrText,
    },
  };
}

/**
 * Convert scanned ingredients to the format AddRecipeModal expects.
 * Uses auto-categorization for each ingredient.
 */
export function convertToRecipeIngredients(
  scannedIngredients: ScannedIngredient[]
): Array<{
  name: string;
  quantity: string;
  unit?: string;
  category: string;
}> {
  return scannedIngredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity || '1', // Default to 1 if no quantity detected
    unit: ing.unit,
    category: autoCategorizeItem(ing.name),
  }));
}
