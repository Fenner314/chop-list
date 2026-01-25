export interface ScannedRecipe {
  name: string;
  ingredients: ScannedIngredient[];
  rawText: string; // Full OCR text for debugging
}

export interface ScannedIngredient {
  name: string;
  quantity?: string; // Only set if confident
  unit?: string; // Only set if confident, must match UNITS values
  originalLine: string; // Raw text line for user reference
  confidence: 'high' | 'medium';
}

export interface OCRBlock {
  text: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
