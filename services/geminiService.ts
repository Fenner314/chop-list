import { ScannedIngredient } from "@/types/recipeScanner";
import * as FileSystem from "expo-file-system/legacy";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export interface GeminiRecipeResult {
  success: boolean;
  recipeName?: string;
  ingredients?: ScannedIngredient[];
  error?: string;
}

const RECIPE_EXTRACTION_PROMPT = `Analyze this image of a recipe and extract the ingredients list. The
ingredient list will be used for grocery shopping, not for actual cooking. It can be assumed that the 
user understands the basics of the recipe, and therefore does not need extraneous detail that is present
in the recipe instructions or ingrdients list.

Return a JSON object with this exact structure:
{
  "recipeName": "Name of the recipe if visible, otherwise empty string",
  "ingredients": [
    {
      "name": "ingredient name (e.g., 'Bread flour', 'Olive oil')",
      "quantity": "numeric quantity as string (e.g., '2', '0.5', '1.5')",
      "unit": "unit abbreviation: cup, tbsp, tsp, oz, lb, g, kg, ml, L, gal, qt, pt, or empty string if none"
    }
  ]
}

Important rules:
- Only extract actual ingredients, not instructions or cooking steps
- Separate multi-ingredient list items into individual ingredients (e.g., "salt and pepper" becomes two ingredients)
- Remove unnecessary descriptors from ingredient names to only include essential text (e.g., "fresh", "large")
- Capitalize ingredient names properly as if they are regular nouns, only capitalizing the first word (e.g., "Olive oil" instead of "olive oil")
- If there are ingredients listed twice, combine them into one with the total quantity
- Convert fractions to decimals (1/2 = 0.5, 1/4 = 0.25, 3/4 = 0.75, 1/3 = 0.33, 2/3 = 0.67)
- Use standard unit abbreviations: cup, tbsp, tsp, oz, lb, g, kg, ml, L, gal, qt, pt
- If no unit is specified (e.g., "2 eggs"), use empty string for unit
- If quantity is unclear, use "1" as default
- Return ONLY the JSON object, no markdown or explanation`;

/**
 * Convert a file URI to base64
 */
async function imageToBase64(uri: string): Promise<string> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: "base64",
  });
  return base64;
}

/**
 * Call Gemini Vision API to extract recipe ingredients from an image
 */
export async function extractRecipeWithGemini(
  imageUri: string,
  apiKey: string
): Promise<GeminiRecipeResult> {
  if (!apiKey) {
    return {
      success: false,
      error:
        "Gemini API key not configured. Please add your API key in Settings.",
    };
  }

  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);

    // Determine mime type from URI
    const mimeType = imageUri.toLowerCase().includes(".png")
      ? "image/png"
      : "image/jpeg";

    // Build the request
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: RECIPE_EXTRACTION_PROMPT,
            },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error?.message || `API error: ${response.status}`;

      if (response.status === 400 && errorMessage.includes("API key")) {
        return {
          success: false,
          error:
            "Invalid Gemini API key. Please check your API key in Settings.",
        };
      }

      return {
        success: false,
        error: errorMessage,
      };
    }

    const data = await response.json();

    // Extract the text response
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      return {
        success: false,
        error: "No response from Gemini. Please try again.",
      };
    }

    // Parse the JSON response
    // Remove any markdown code blocks if present
    const cleanedResponse = textResponse
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    const parsed = JSON.parse(cleanedResponse);

    if (!parsed.ingredients || !Array.isArray(parsed.ingredients)) {
      return {
        success: false,
        error: "Could not identify ingredients in the image.",
      };
    }

    // Convert to ScannedIngredient format
    const ingredients: ScannedIngredient[] = parsed.ingredients
      .map((ing: any) => ({
        name: ing.name || "",
        quantity: ing.quantity || "1",
        unit: ing.unit || undefined,
        originalLine: `${ing.quantity || ""} ${ing.unit || ""} ${
          ing.name || ""
        }`.trim(),
        confidence: "high" as const,
      }))
      .filter((ing: ScannedIngredient) => ing.name.trim().length > 0);

    return {
      success: true,
      recipeName: parsed.recipeName || "",
      ingredients,
    };
  } catch (error) {
    console.error("Gemini API error:", error);

    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "Failed to parse recipe data. Please try again.",
      };
    }

    return {
      success: false,
      error: "Failed to analyze image. Please check your internet connection.",
    };
  }
}
