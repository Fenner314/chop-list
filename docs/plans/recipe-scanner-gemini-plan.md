# Recipe Scanner Feature - Gemini API Implementation Plan (Alternative)

> **Note:** This is the alternative plan using Google Gemini API for intelligent parsing. The primary implementation uses the offline-only approach. This plan is preserved for future reference if cloud-based parsing is desired.

## Overview

Add camera-based recipe scanning that uses on-device OCR combined with Google Gemini API for intelligent parsing to extract recipe name, ingredients, quantities, and units from a photo, then opens the existing `AddRecipeModal` pre-populated with the extracted data for user verification before saving.

**Key Principle:** Prioritize ingredient names over quantities. If quantity/unit parsing is uncertain, omit them entirely rather than guessing wrong.

---

## Technology Stack

| Component | Library | Why |
|-----------|---------|-----|
| Camera | `react-native-vision-camera` v4 | Best-in-class RN camera, active maintenance |
| OCR (Offline fallback) | `react-native-vision-camera-ocr-plus` | ML Kit powered, works offline |
| Intelligent Parsing | Google Gemini API (Free tier) | Best results, understands context |

**Cost:** Free (Gemini free tier: ~20-50 requests/day)
**Offline:** Partial (falls back to local parser when offline)
**Processing:** 2-5 seconds (API call)

---

## Gemini API Free Tier Details

| Feature | Limit |
|---------|-------|
| Requests per minute | 5-15 RPM |
| Requests per day | 20-50 RPD (reduced Dec 2025) |
| Context window | 1 million tokens |
| Credit card required | No |
| Commercial use | Allowed |

**Caveats:**
- Data may be used to train Google's models on free tier
- Not available for EU/UK/Swiss users on free tier
- Rate limits were reduced in December 2025

---

## Implementation Steps

### 1. Install Dependencies

```bash
npx expo install react-native-vision-camera
npm install react-native-vision-camera-ocr-plus
npm install @google/generative-ai
```

Add to `app.json`:
```json
{
  "expo": {
    "plugins": [
      [
        "react-native-vision-camera",
        {
          "cameraPermissionText": "Allow $(PRODUCT_NAME) to access your camera to scan recipes"
        }
      ]
    ]
  }
}
```

---

### 2. Create Types

**File:** `types/recipeScanner.ts`

```typescript
export interface ScannedRecipe {
  name: string;
  ingredients: ScannedIngredient[];
  rawText: string;
  source: 'gemini' | 'local'; // Track which parser was used
}

export interface ScannedIngredient {
  name: string;
  quantity?: string;
  unit?: string;
  originalLine?: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface GeminiRecipeResponse {
  name: string;
  servings?: number;
  ingredients: Array<{
    name: string;
    quantity?: string;
    unit?: string;
  }>;
}
```

---

### 3. Create Gemini Service

**File:** `services/geminiService.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { UNITS, ALL_UNITS } from '@/utils/unitConversion';
import { GeminiRecipeResponse, ScannedIngredient } from '@/types/recipeScanner';

// Initialize with API key from environment
const genAI = new GoogleGenerativeAI(process.env.EXPO_PUBLIC_GEMINI_API_KEY || '');

const AVAILABLE_UNITS = ALL_UNITS.map(u => u.value).join(', ');

const SYSTEM_PROMPT = `You are a recipe parser. Extract recipe information from the provided text.

IMPORTANT RULES:
1. The ingredient NAME is the most important field - always extract it
2. Only include "quantity" if you are CONFIDENT about the number
3. Only include "unit" if it EXACTLY matches one of these values: ${AVAILABLE_UNITS}
4. If unsure about quantity or unit, OMIT them entirely (don't guess)
5. Convert fractions to decimals (1/2 = 0.5, 1 1/2 = 1.5)
6. For "salt to taste" or similar, just use the name without quantity/unit
7. Ignore non-ingredient lines (instructions, tips, serving suggestions)

Return JSON in this exact format:
{
  "name": "Recipe Name",
  "servings": 4,
  "ingredients": [
    { "name": "flour", "quantity": "2", "unit": "cup" },
    { "name": "eggs", "quantity": "3" },
    { "name": "salt" }
  ]
}

Only return valid JSON, no other text.`;

export async function parseRecipeWithGemini(ocrText: string): Promise<GeminiRecipeResponse | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      { text: `Parse this recipe text:\n\n${ocrText}` },
    ]);

    const response = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('No JSON found in Gemini response');
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]) as GeminiRecipeResponse;

    // Validate units match our allowed values
    const validUnits = new Set(ALL_UNITS.map(u => u.value));
    parsed.ingredients = parsed.ingredients.map(ing => ({
      ...ing,
      unit: ing.unit && validUnits.has(ing.unit) ? ing.unit : undefined,
    }));

    return parsed;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

export function convertGeminiToScannedIngredients(
  geminiResponse: GeminiRecipeResponse
): ScannedIngredient[] {
  return geminiResponse.ingredients.map(ing => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    confidence: 'high' as const, // Gemini results are generally reliable
  }));
}
```

---

### 4. Create Hybrid Scanner Service

**File:** `services/recipeScannerService.ts`

```typescript
import { ScannedRecipe, ScannedIngredient } from '@/types/recipeScanner';
import { parseRecipeText, extractRecipeName } from '@/utils/ingredientParser';
import { parseRecipeWithGemini, convertGeminiToScannedIngredients } from './geminiService';
import { autoCategorizeItem } from '@/utils/categorization';
import NetInfo from '@react-native-community/netinfo';

export interface ScanResult {
  success: boolean;
  recipe?: ScannedRecipe;
  error?: string;
}

export async function processOCRResult(ocrText: string): Promise<ScanResult> {
  if (!ocrText || ocrText.trim().length < 10) {
    return {
      success: false,
      error: 'Could not read text from image. Please try again with better lighting.',
    };
  }

  // Check network connectivity
  const netState = await NetInfo.fetch();
  const isOnline = netState.isConnected && netState.isInternetReachable;

  let recipe: ScannedRecipe;

  if (isOnline) {
    // Try Gemini first for best results
    try {
      const geminiResult = await parseRecipeWithGemini(ocrText);

      if (geminiResult && geminiResult.ingredients.length > 0) {
        recipe = {
          name: geminiResult.name || '',
          ingredients: convertGeminiToScannedIngredients(geminiResult),
          rawText: ocrText,
          source: 'gemini',
        };

        return { success: true, recipe };
      }
    } catch (error) {
      console.warn('Gemini parsing failed, falling back to local parser:', error);
    }
  }

  // Fallback to local parser (offline or Gemini failed)
  const ingredients = parseRecipeText(ocrText);

  if (ingredients.length === 0) {
    return {
      success: false,
      error: 'No ingredients detected. Make sure the recipe ingredients are visible.',
    };
  }

  const name = extractRecipeName(ocrText);

  recipe = {
    name,
    ingredients,
    rawText: ocrText,
    source: 'local',
  };

  return { success: true, recipe };
}

export function convertToRecipeIngredients(
  scannedIngredients: ScannedIngredient[]
): Array<{
  name: string;
  quantity: string;
  unit?: string;
  category: string;
}> {
  return scannedIngredients.map(ing => ({
    name: ing.name,
    quantity: ing.quantity || '1',
    unit: ing.unit,
    category: autoCategorizeItem(ing.name),
  }));
}
```

---

### 5. Environment Configuration

**File:** `.env`

```
EXPO_PUBLIC_GEMINI_API_KEY=your_api_key_here
```

**File:** `app.json` (add to extra):

```json
{
  "expo": {
    "extra": {
      "geminiApiKey": "${EXPO_PUBLIC_GEMINI_API_KEY}"
    }
  }
}
```

---

### 6. Settings Option for API Key

Allow users to provide their own Gemini API key for unlimited usage.

**File:** `app/(tabs)/settings.tsx` (add section):

```typescript
// In settings screen, add:
<View style={styles.settingSection}>
  <ChopText size="medium" weight="semibold">Recipe Scanner</ChopText>
  <ChopText size="xs" variant="muted" style={{ marginBottom: 12 }}>
    Optionally provide your own Gemini API key for better recipe parsing
  </ChopText>
  <TextInput
    style={styles.input}
    value={geminiApiKey}
    onChangeText={setGeminiApiKey}
    placeholder="Enter Gemini API key (optional)"
    secureTextEntry
  />
  <ChopText size="xs" variant="muted">
    Get a free key at ai.google.dev
  </ChopText>
</View>
```

---

## Comparison: Gemini vs Local Parser

| Scenario | Gemini (Online) | Local Parser (Offline) |
|----------|-----------------|------------------------|
| "2 cups all-purpose flour" | `{name: "all-purpose flour", qty: "2", unit: "cup"}` | Same |
| "1½ sticks butter, softened" | `{name: "butter", qty: "0.75", unit: "cup"}` | `{name: "butter, softened"}` |
| Handwritten recipe | Good OCR understanding | May struggle |
| "Salt and pepper to taste" | `{name: "salt"}, {name: "pepper"}` | `{name: "salt and pepper to taste"}` |
| Recipe in Spanish | Translates + parses | Names only |
| "1 14oz can tomatoes" | `{name: "canned tomatoes", qty: "14", unit: "oz"}` | May struggle |

---

## User Flow

1. User taps camera icon on Recipes screen
2. Camera view opens with frame guide
3. User takes photo of recipe
4. Loading indicator: "Analyzing recipe..."
5. System checks connectivity:
   - **Online:** Send to Gemini API → Get structured response
   - **Offline:** Use local ML Kit OCR + regex parser
6. On success:
   - Scanner modal closes
   - AddRecipeModal opens with pre-filled data
   - Small indicator shows which parser was used
7. User reviews, edits as needed, saves

---

## Cost Analysis

For personal use with ~5-10 recipe scans per day:
- **Gemini Free Tier:** More than sufficient (20-50 requests/day)
- **Total Cost:** $0

For heavy usage:
- Consider Gemini paid tier ($0.075 per 1M input tokens)
- Or rely more on local parser

---

## Advantages Over Pure Offline

1. **Better accuracy** - Understands context, not just regex
2. **Handles edge cases** - "sticks of butter", "cloves of garlic"
3. **Fraction handling** - Converts "1½" properly
4. **Multi-language** - Can parse recipes in other languages
5. **Format flexibility** - Handles unusual recipe layouts

---

## Disadvantages

1. **Requires internet** for best results
2. **API dependency** - Google could change pricing/availability
3. **Privacy** - Recipe images sent to Google servers
4. **Latency** - 2-5 second processing time vs instant local

---

## Future Enhancements

1. **Image-based parsing** - Send image directly to Gemini Vision (skip OCR step)
2. **Batch scanning** - Scan multiple recipe pages
3. **Recipe URL import** - Parse recipe from website using Gemini
4. **Offline model** - Train small local model on parsed recipes for better offline results
