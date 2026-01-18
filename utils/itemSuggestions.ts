import { Item } from "@/store/slices/itemsSlice";

/**
 * Get all unique item names from categorization keywords
 */
export function getAllCommonItems(): string[] {
  // Common grocery items extracted from categorization lists
  const commonItems = [
    // Dairy & Eggs
    "Milk",
    "Eggs",
    "Butter",
    "Cheese",
    "Yogurt",
    "Cream Cheese",
    "Sour Cream",

    // Produce
    "Apples",
    "Bananas",
    "Oranges",
    "Tomatoes",
    "Potatoes",
    "Onions",
    "Garlic",
    "Lettuce",
    "Carrots",
    "Broccoli",
    "Spinach",
    "Strawberries",
    "Blueberries",
    "Grapes",
    "Lemons",
    "Limes",
    "Avocados",
    "Peppers",
    "Cucumbers",

    // Meat & Seafood
    "Chicken Breast",
    "Ground Beef",
    "Bacon",
    "Salmon",
    "Shrimp",

    // Bakery
    "Bread",
    "Bagels",
    "Tortillas",

    // Pantry
    "Rice",
    "Pasta",
    "Flour",
    "Sugar",
    "Olive Oil",
    "Salt",
    "Pepper",

    // Canned
    "Beans",
    "Tomato Sauce",
    "Chicken Broth",

    // Beverages
    "Water",
    "Coffee",
    "Orange Juice",

    // Household
    "Paper Towels",
    "Toilet Paper",
    "Dish Soap",
  ];

  return commonItems;
}

/**
 * Get item name suggestions based on search query
 * Combines common items and user history
 * @param query - The search query
 * @param items - All items from the store (for user history)
 * @param itemNameHistory - Array of previously used item names
 * @param maxResults - Maximum number of suggestions to return (default: 4)
 * @returns Array of suggested item names
 */
export function getItemNameSuggestions(
  query: string,
  items: Item[],
  itemNameHistory: string[] = [],
  maxResults: number = 4
): string[] {
  if (!query.trim()) {
    return [];
  }

  const normalizedQuery = query.toLowerCase().trim();
  const suggestions = new Set<string>();

  // 1. Get user history items (prioritized)
  const historyMatches = itemNameHistory
    .filter(name => name.toLowerCase().includes(normalizedQuery))
    .slice(0, maxResults);

  historyMatches.forEach(name => suggestions.add(name));

  // 2. Get items from current store
  const storeMatches = items
    .filter(item => item.name.toLowerCase().includes(normalizedQuery))
    .map(item => item.name)
    .filter(name => !suggestions.has(name))
    .slice(0, maxResults - suggestions.size);

  storeMatches.forEach(name => suggestions.add(name));

  // 3. Get common items if we still need more suggestions
  if (suggestions.size < maxResults) {
    const commonItems = getAllCommonItems();
    const commonMatches = commonItems
      .filter(name => name.toLowerCase().includes(normalizedQuery))
      .filter(name => !suggestions.has(name))
      .slice(0, maxResults - suggestions.size);

    commonMatches.forEach(name => suggestions.add(name));
  }

  return Array.from(suggestions).slice(0, maxResults);
}

/**
 * Add an item name to the history
 * Maintains uniqueness and keeps most recent items at the front
 * @param itemName - The item name to add
 * @param history - Current history array
 * @param maxHistorySize - Maximum number of items to keep in history (default: 100)
 * @returns Updated history array
 */
export function addToItemNameHistory(
  itemName: string,
  history: string[] = [],
  maxHistorySize: number = 100
): string[] {
  const trimmedName = itemName.trim();
  if (!trimmedName) {
    return history;
  }

  // Remove if it already exists (case-insensitive)
  const filtered = history.filter(
    name => name.toLowerCase() !== trimmedName.toLowerCase()
  );

  // Add to front
  const newHistory = [trimmedName, ...filtered];

  // Limit size
  return newHistory.slice(0, maxHistorySize);
}
