# Recipe Scanner Feature - Offline Implementation Plan

## Overview

Add camera-based recipe scanning that uses on-device OCR (ML Kit) to extract recipe name, ingredients, quantities, and units from a photo, then opens the existing `AddRecipeModal` pre-populated with the extracted data for user verification before saving.

**Key Principle:** Prioritize ingredient names over quantities. If quantity/unit parsing is uncertain, omit them entirely rather than guessing wrong.

---

## Technology Stack

| Component | Library | Why |
|-----------|---------|-----|
| Camera | `react-native-vision-camera` v4 | Best-in-class RN camera, active maintenance |
| OCR | `react-native-vision-camera-ocr-plus` | ML Kit powered, actively maintained, works with VisionCamera v4+ |
| Parsing | Custom regex/heuristic parser | Free, offline, fast |

**Cost:** 100% Free
**Offline:** 100% Offline capable
**Processing:** Near-instant (on-device)

---

## Implementation Steps

### 1. Install Dependencies

```bash
npx expo install react-native-vision-camera
npm install react-native-vision-camera-ocr-plus
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
  rawText: string; // Full OCR text for debugging
}

export interface ScannedIngredient {
  name: string;
  quantity?: string;  // Only set if confident
  unit?: string;      // Only set if confident, must match UNITS values
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
```

---

### 3. Create Ingredient Parser Utility

**File:** `utils/ingredientParser.ts`

Core parsing logic:

```typescript
import { UNITS } from './unitConversion';
import { ScannedIngredient } from '@/types/recipeScanner';

// Map of common unit variations to our standard units
const UNIT_ALIASES: Record<string, string> = {
  // Volume
  'teaspoon': 'tsp', 'teaspoons': 'tsp', 'tsp': 'tsp', 'tsps': 'tsp', 't': 'tsp',
  'tablespoon': 'tbsp', 'tablespoons': 'tbsp', 'tbsp': 'tbsp', 'tbsps': 'tbsp', 'tbs': 'tbsp', 'T': 'tbsp',
  'cup': 'cup', 'cups': 'cup', 'c': 'cup',
  'pint': 'pint', 'pints': 'pint', 'pt': 'pint',
  'quart': 'quart', 'quarts': 'quart', 'qt': 'quart',
  'gallon': 'gallon', 'gallons': 'gallon', 'gal': 'gallon',
  'milliliter': 'mL', 'milliliters': 'mL', 'ml': 'mL',
  'liter': 'L', 'liters': 'L', 'l': 'L',
  'fluid ounce': 'fl oz', 'fluid ounces': 'fl oz', 'fl oz': 'fl oz', 'fl. oz.': 'fl oz',

  // Weight
  'gram': 'g', 'grams': 'g', 'g': 'g',
  'kilogram': 'kg', 'kilograms': 'kg', 'kg': 'kg',
  'milligram': 'mg', 'milligrams': 'mg', 'mg': 'mg',
  'ounce': 'oz', 'ounces': 'oz', 'oz': 'oz',
  'pound': 'lb', 'pounds': 'lb', 'lb': 'lb', 'lbs': 'lb',

  // Count
  'piece': 'piece', 'pieces': 'piece', 'pc': 'piece', 'pcs': 'piece',
  'item': 'item', 'items': 'item',
  'whole': 'whole',

  // Other
  'pinch': 'pinch', 'pinches': 'pinch',
  'dash': 'dash', 'dashes': 'dash',
};

// Regex for quantity (handles fractions, decimals, ranges)
const QUANTITY_REGEX = /^(\d+\/\d+|\d+\.\d+|\d+\s+\d+\/\d+|\d+-\d+|\d+)/;

// Words that indicate this line is NOT an ingredient
const EXCLUDE_PATTERNS = [
  /^instructions?:?$/i,
  /^directions?:?$/i,
  /^steps?:?$/i,
  /^method:?$/i,
  /^serves?\s+\d+/i,
  /^prep\s+time/i,
  /^cook\s+time/i,
  /^total\s+time/i,
  /^\d+\.\s+\w+/,  // Numbered instruction steps like "1. Preheat oven"
];

export function parseIngredientLine(line: string): ScannedIngredient | null {
  const trimmed = line.trim();

  // Skip empty lines or instruction-like lines
  if (!trimmed || trimmed.length < 2) return null;
  if (EXCLUDE_PATTERNS.some(pattern => pattern.test(trimmed))) return null;

  let remaining = trimmed;
  let quantity: string | undefined;
  let unit: string | undefined;
  let confidence: 'high' | 'medium' | 'low' = 'high';

  // Try to extract quantity
  const qtyMatch = remaining.match(QUANTITY_REGEX);
  if (qtyMatch) {
    const rawQty = qtyMatch[1];
    // Convert mixed fractions like "1 1/2" to decimal
    quantity = normalizeQuantity(rawQty);
    remaining = remaining.slice(qtyMatch[0].length).trim();

    // If quantity parsing was complex, lower confidence
    if (rawQty.includes('/') || rawQty.includes('-')) {
      confidence = 'medium';
    }
  }

  // Try to extract unit
  const words = remaining.split(/\s+/);
  if (words.length > 0) {
    const potentialUnit = words[0].toLowerCase().replace(/[.,]/g, '');
    const standardUnit = UNIT_ALIASES[potentialUnit];

    if (standardUnit) {
      unit = standardUnit;
      remaining = words.slice(1).join(' ').trim();
    } else {
      // Unknown unit - don't guess, clear quantity too if we're not confident
      if (quantity && !isSimpleNumber(quantity)) {
        confidence = 'low';
      }
    }
  }

  // Clean up the ingredient name
  const name = cleanIngredientName(remaining);

  if (!name || name.length < 2) return null;

  // If confidence is low, omit quantity and unit entirely
  if (confidence === 'low') {
    return {
      name,
      originalLine: trimmed,
      confidence,
    };
  }

  // If we have quantity but no recognized unit, only keep quantity if it's clearly a count
  if (quantity && !unit) {
    const qtyNum = parseFloat(quantity);
    // Only keep quantity without unit if it's a small whole number (likely a count)
    if (!Number.isInteger(qtyNum) || qtyNum > 12) {
      return {
        name,
        originalLine: trimmed,
        confidence: 'medium',
      };
    }
  }

  return {
    name,
    quantity,
    unit,
    originalLine: trimmed,
    confidence,
  };
}

function normalizeQuantity(raw: string): string {
  // Handle mixed fractions like "1 1/2"
  const mixedMatch = raw.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1]);
    const num = parseInt(mixedMatch[2]);
    const denom = parseInt(mixedMatch[3]);
    return (whole + num / denom).toString();
  }

  // Handle simple fractions like "1/2"
  const fractionMatch = raw.match(/^(\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1]);
    const denom = parseInt(fractionMatch[2]);
    return (num / denom).toString();
  }

  // Handle ranges like "2-3" - take the lower bound
  const rangeMatch = raw.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    return rangeMatch[1];
  }

  return raw;
}

function isSimpleNumber(qty: string): boolean {
  const num = parseFloat(qty);
  return !isNaN(num) && Number.isInteger(num) && num <= 20;
}

function cleanIngredientName(name: string): string {
  return name
    .replace(/[,;]$/, '')           // Remove trailing punctuation
    .replace(/\s*\([^)]*\)\s*/g, ' ') // Remove parenthetical notes
    .replace(/\s+/g, ' ')           // Normalize whitespace
    .trim();
}

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

export function extractRecipeName(ocrText: string): string {
  const lines = ocrText.split('\n').filter(l => l.trim());

  // First non-empty line is often the recipe name
  // Unless it looks like an ingredient (starts with number)
  for (const line of lines.slice(0, 3)) {
    const trimmed = line.trim();
    if (trimmed.length > 2 && !QUANTITY_REGEX.test(trimmed)) {
      // Likely a title
      return trimmed;
    }
  }

  return '';
}
```

---

### 4. Create Recipe Scanner Service

**File:** `services/recipeScannerService.ts`

```typescript
import { ScannedRecipe, ScannedIngredient } from '@/types/recipeScanner';
import { parseRecipeText, extractRecipeName } from '@/utils/ingredientParser';
import { autoCategorizeItem } from '@/utils/categorization';

export interface ScanResult {
  success: boolean;
  recipe?: ScannedRecipe;
  error?: string;
}

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

// Convert scanned ingredients to the format AddRecipeModal expects
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
    quantity: ing.quantity || '1', // Default to 1 if no quantity
    unit: ing.unit,
    category: autoCategorizeItem(ing.name),
  }));
}
```

---

### 5. Create Camera Scanner Component

**File:** `components/recipe-scanner.tsx`

```typescript
import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { useOCR } from 'react-native-vision-camera-ocr-plus';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChopText } from './chop-text';
import { IconSymbol } from './ui/icon-symbol';
import { useAppSelector } from '@/store/hooks';
import { processOCRResult, ScanResult } from '@/services/recipeScannerService';

interface RecipeScannerProps {
  onScanComplete: (result: ScanResult) => void;
  onClose: () => void;
}

export function RecipeScanner({ onScanComplete, onClose }: RecipeScannerProps) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  const [ocr] = useOCR();

  const darkMode = useAppSelector(state => state.settings.darkMode);
  const themeColor = useAppSelector(state => state.settings.themeColor);

  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Request permission if needed
  React.useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleCapture = async () => {
    if (!camera.current) return;

    setIsProcessing(true);
    setError(null);

    try {
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'quality',
      });

      setCapturedPhoto(`file://${photo.path}`);

      // Run OCR on the captured image
      const ocrResult = await ocr(photo.path);
      const fullText = ocrResult?.text || '';

      const scanResult = processOCRResult(fullText);

      if (scanResult.success) {
        onScanComplete(scanResult);
      } else {
        setError(scanResult.error || 'Failed to process image');
        setCapturedPhoto(null);
      }
    } catch (err) {
      setError('Failed to capture photo. Please try again.');
      setCapturedPhoto(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setCapturedPhoto(null);
    setError(null);
  };

  if (!hasPermission) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
        <View style={styles.centered}>
          <ChopText size="medium">Camera permission required</ChopText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColor }]}
            onPress={requestPermission}
          >
            <ChopText color="#fff">Grant Permission</ChopText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
        <View style={styles.centered}>
          <ChopText size="medium">No camera device found</ChopText>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']} style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <IconSymbol name="xmark" size={24} color="#fff" />
        </TouchableOpacity>
        <ChopText color="#fff" size="large" weight="semibold">
          Scan Recipe
        </ChopText>
        <View style={{ width: 40 }} />
      </SafeAreaView>

      {/* Camera or Preview */}
      {capturedPhoto ? (
        <Image source={{ uri: capturedPhoto }} style={styles.preview} />
      ) : (
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          photo={true}
        />
      )}

      {/* Overlay for guidance */}
      {!capturedPhoto && !isProcessing && (
        <View style={styles.overlay}>
          <View style={styles.scanFrame} />
          <ChopText color="#fff" size="small" style={styles.hint}>
            Position the recipe within the frame
          </ChopText>
        </View>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <View style={styles.processingOverlay}>
          <ActivityIndicator size="large" color={themeColor} />
          <ChopText color="#fff" size="medium" style={{ marginTop: 16 }}>
            Analyzing recipe...
          </ChopText>
        </View>
      )}

      {/* Error state */}
      {error && (
        <View style={styles.errorOverlay}>
          <IconSymbol name="exclamationmark.triangle" size={48} color="#ff3b30" />
          <ChopText color="#fff" size="medium" style={styles.errorText}>
            {error}
          </ChopText>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: themeColor }]}
            onPress={handleRetry}
          >
            <ChopText color="#fff" weight="semibold">Try Again</ChopText>
          </TouchableOpacity>
        </View>
      )}

      {/* Capture button */}
      {!capturedPhoto && !isProcessing && !error && (
        <SafeAreaView edges={['bottom']} style={styles.controls}>
          <TouchableOpacity
            style={[styles.captureButton, { borderColor: themeColor }]}
            onPress={handleCapture}
          >
            <View style={[styles.captureButtonInner, { backgroundColor: themeColor }]} />
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  preview: {
    flex: 1,
    resizeMode: 'contain',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: '85%',
    height: '60%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 12,
  },
  hint: {
    marginTop: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 32,
  },
  errorText: {
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingBottom: 32,
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
```

---

### 6. Create Scanner Modal

**File:** `components/recipe-scanner-modal.tsx`

```typescript
import React from 'react';
import { Modal } from 'react-native';
import { RecipeScanner } from './recipe-scanner';
import { ScanResult } from '@/services/recipeScannerService';

interface RecipeScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScanComplete: (result: ScanResult) => void;
}

export function RecipeScannerModal({
  visible,
  onClose,
  onScanComplete,
}: RecipeScannerModalProps) {
  const handleScanComplete = (result: ScanResult) => {
    onScanComplete(result);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <RecipeScanner
        onScanComplete={handleScanComplete}
        onClose={onClose}
      />
    </Modal>
  );
}
```

---

### 7. Update AddRecipeModal Props

**File:** `components/add-recipe-modal.tsx`

Update the props interface to support pre-filled data:

```typescript
interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  editRecipe?: Recipe;
  preselectedIngredients?: Array<{
    name: string;
    quantity: string;
    unit?: string;      // ADD: unit support
    category: string;
  }>;
  prefilledName?: string;        // ADD: for scanned recipe name
  prefilledDescription?: string; // ADD: optional
  prefilledServings?: number;    // ADD: optional
}
```

Update the `useEffect` that handles initial state:

```typescript
useEffect(() => {
  if (editRecipe) {
    // ... existing edit logic
  } else {
    setName(prefilledName || '');
    setDescription(prefilledDescription || '');
    setServings(prefilledServings?.toString() || defaultServings.toString());

    if (preselectedIngredients && preselectedIngredients.length > 0) {
      const preselected: RecipeIngredient[] = preselectedIngredients.map(
        (item) => ({
          id: `${Date.now()}-${Math.random()}`,
          name: item.name,
          quantity: item.quantity,
          unit: item.unit,  // ADD: include unit
          category: item.category,
        })
      );
      setIngredients(preselected);
    } else {
      setIngredients([]);
    }
  }
  // ... rest of reset logic
}, [editRecipe, visible, preselectedIngredients, prefilledName, prefilledDescription, prefilledServings, defaultServings]);
```

---

### 8. Update Recipes Screen

**File:** `app/(tabs)/recipes.tsx`

Add scanner button and modal integration:

```typescript
import { RecipeScannerModal } from '@/components/recipe-scanner-modal';
import { ScanResult, convertToRecipeIngredients } from '@/services/recipeScannerService';

// Inside the component:
const [scannerVisible, setScannerVisible] = useState(false);
const [scannedRecipeData, setScannedRecipeData] = useState<{
  name: string;
  ingredients: Array<{ name: string; quantity: string; unit?: string; category: string }>;
} | null>(null);

const handleScanComplete = (result: ScanResult) => {
  if (result.success && result.recipe) {
    const ingredients = convertToRecipeIngredients(result.recipe.ingredients);
    setScannedRecipeData({
      name: result.recipe.name,
      ingredients,
    });
    // Open the add recipe modal with scanned data
    setAddRecipeModalVisible(true);
  }
};

// In the header, add a camera button:
<TouchableOpacity onPress={() => setScannerVisible(true)}>
  <IconSymbol name="camera" size={24} color={themeColor} />
</TouchableOpacity>

// Add the scanner modal:
<RecipeScannerModal
  visible={scannerVisible}
  onClose={() => setScannerVisible(false)}
  onScanComplete={handleScanComplete}
/>

// Update AddRecipeModal usage:
<AddRecipeModal
  visible={addRecipeModalVisible}
  onClose={() => {
    setAddRecipeModalVisible(false);
    setScannedRecipeData(null);
  }}
  prefilledName={scannedRecipeData?.name}
  preselectedIngredients={scannedRecipeData?.ingredients}
/>
```

---

## File Structure

```
/types
  └── recipeScanner.ts           # TypeScript interfaces
/utils
  └── ingredientParser.ts        # Parsing logic for OCR text
/services
  └── recipeScannerService.ts    # OCR processing orchestration
/components
  ├── recipe-scanner.tsx         # Camera capture component
  ├── recipe-scanner-modal.tsx   # Modal wrapper
  └── add-recipe-modal.tsx       # Updated with new props
/app/(tabs)
  └── recipes.tsx                # Updated with scanner button
```

---

## Parsing Strategy

### Priority: Ingredient Name First

The parser follows this philosophy:
1. **Always extract the ingredient name** - This is the most important piece
2. **Only include quantity if confident** - Simple numbers like "2" or "1.5" are safe
3. **Only include unit if recognized** - Must match one of our `UNITS` values exactly
4. **When in doubt, omit quantity/unit** - User can easily add them manually

### What Gets Parsed

| Input | Output |
|-------|--------|
| "2 cups flour" | `{ name: "flour", quantity: "2", unit: "cup" }` |
| "1 lb ground beef" | `{ name: "ground beef", quantity: "1", unit: "lb" }` |
| "3 eggs" | `{ name: "eggs", quantity: "3" }` |
| "salt to taste" | `{ name: "salt to taste" }` |
| "1 bunch cilantro" | `{ name: "cilantro" }` (unknown unit "bunch") |
| "handful of spinach" | `{ name: "spinach" }` |

### Lines That Get Skipped

- Empty lines
- "Instructions:", "Directions:", etc.
- "Serves 4", "Prep time: 10 min"
- Numbered steps like "1. Preheat oven to 350°F"

---

## User Flow

1. User taps camera icon on Recipes screen
2. Camera view opens with frame guide
3. User takes photo of recipe
4. Loading indicator: "Analyzing recipe..."
5. On success:
   - Scanner modal closes
   - AddRecipeModal opens with:
     - Recipe name pre-filled (if detected)
     - Ingredients list pre-populated
     - User reviews and edits as needed
6. On failure:
   - Error message shown
   - "Try Again" button to retake photo

---

## Limitations & Trade-offs

| Limitation | Mitigation |
|------------|------------|
| Handwritten recipes may not OCR well | User can manually correct in modal |
| Non-standard units (e.g., "sticks", "cloves") | Only ingredient name extracted, user adds unit |
| Non-English recipes | Limited support, names extracted as-is |
| Complex formatting (multi-column) | May extract lines out of order |

---

## Future Enhancements

1. **Real-time preview** - Show OCR results as user points camera
2. **Manual text input** - Paste recipe text from clipboard
3. **Recipe URL import** - Parse recipe from website URL
4. **Learning from corrections** - Improve parser based on user edits
