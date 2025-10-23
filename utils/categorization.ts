// Auto-categorization utility for pantry items

interface CategoryKeywords {
  [key: string]: string[];
}

const CATEGORY_KEYWORDS: CategoryKeywords = {
  dairy: [
    'milk', 'cheese', 'butter', 'cream', 'yogurt', 'sour cream', 'cottage cheese',
    'cream cheese', 'mozzarella', 'cheddar', 'parmesan', 'eggs', 'egg', 'whey',
    'buttermilk', 'ricotta', 'brie', 'goat cheese', 'feta'
  ],
  produce: [
    'apple', 'banana', 'orange', 'grape', 'berry', 'tomato', 'potato', 'onion',
    'lettuce', 'carrot', 'broccoli', 'spinach', 'pepper', 'cucumber', 'celery',
    'avocado', 'lemon', 'lime', 'strawberry', 'blueberry', 'melon', 'peach',
    'pear', 'plum', 'cherry', 'pineapple', 'mango', 'kale', 'cabbage', 'zucchini',
    'squash', 'eggplant', 'mushroom', 'garlic', 'ginger', 'cilantro', 'parsley',
    'basil', 'mint', 'radish', 'beet', 'turnip', 'asparagus', 'green bean',
    'corn', 'peas', 'cauliflower', 'kiwi', 'watermelon', 'cantaloupe'
  ],
  meat: [
    'chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna',
    'shrimp', 'bacon', 'sausage', 'ham', 'steak', 'ground beef', 'chicken breast',
    'drumstick', 'thigh', 'ribeye', 'sirloin', 'tenderloin', 'cod', 'tilapia',
    'mahi', 'halibut', 'crab', 'lobster', 'scallops', 'mussels', 'clams', 'veal',
    'duck', 'goose', 'venison', 'bison'
  ],
  bakery: [
    'bread', 'bagel', 'roll', 'bun', 'croissant', 'muffin', 'donut', 'danish',
    'baguette', 'pita', 'tortilla', 'english muffin', 'ciabatta', 'sourdough',
    'wheat bread', 'white bread', 'rye bread', 'pumpernickel', 'focaccia'
  ],
  frozen: [
    'frozen', 'ice cream', 'popsicle', 'frozen pizza', 'frozen vegetables',
    'frozen fruit', 'frozen meal', 'frozen dinner', 'frozen french fries',
    'frozen waffle', 'frozen burrito', 'sorbet', 'gelato'
  ],
  canned: [
    'canned', 'can of', 'beans', 'soup', 'tomato sauce', 'tomato paste',
    'crushed tomatoes', 'diced tomatoes', 'chickpeas', 'black beans',
    'kidney beans', 'pinto beans', 'corn', 'peas', 'green beans', 'tuna',
    'salmon', 'olives', 'pickles', 'broth', 'stock'
  ],
  beverages: [
    'water', 'juice', 'soda', 'cola', 'beer', 'wine', 'coffee', 'tea',
    'sports drink', 'energy drink', 'milk', 'lemonade', 'iced tea', 'pop',
    'sparkling water', 'mineral water', 'coconut water', 'kombucha', 'cider'
  ],
  snacks: [
    'chips', 'crackers', 'cookies', 'candy', 'chocolate', 'popcorn', 'pretzels',
    'nuts', 'trail mix', 'granola bar', 'protein bar', 'fruit snacks',
    'gummy', 'cheese puffs', 'doritos', 'lays', 'pringles', 'oreos'
  ],
  pantry: [
    'rice', 'flour', 'sugar', 'salt', 'pepper', 'oil', 'olive oil', 'vegetable oil',
    'canola oil', 'coconut oil', 'vinegar', 'honey', 'syrup', 'maple syrup',
    'peanut butter', 'jelly', 'jam', 'preserves'
  ],
  spices: [
    'spice', 'cinnamon', 'paprika', 'cumin', 'oregano', 'thyme', 'rosemary',
    'bay leaf', 'cayenne', 'chili powder', 'turmeric', 'curry', 'cardamom',
    'clove', 'nutmeg', 'ginger powder', 'garlic powder', 'onion powder',
    'black pepper', 'white pepper', 'red pepper flakes', 'italian seasoning',
    'cajun seasoning', 'taco seasoning'
  ],
  condiments: [
    'ketchup', 'mustard', 'mayo', 'mayonnaise', 'relish', 'hot sauce', 'salsa',
    'bbq sauce', 'soy sauce', 'worcestershire', 'ranch', 'dressing', 'marinade',
    'sauce', 'sriracha', 'tabasco', 'hummus', 'guacamole', 'tartar sauce'
  ],
  grains: [
    'pasta', 'spaghetti', 'penne', 'macaroni', 'noodles', 'ramen', 'couscous',
    'quinoa', 'oats', 'oatmeal', 'cereal', 'granola', 'barley', 'bulgur',
    'farro', 'rice', 'brown rice', 'wild rice', 'jasmine rice', 'basmati'
  ],
  baking: [
    'baking soda', 'baking powder', 'yeast', 'cornstarch', 'vanilla extract',
    'almond extract', 'cocoa powder', 'chocolate chips', 'brown sugar',
    'powdered sugar', 'confectioners sugar', 'cake mix', 'brownie mix',
    'frosting', 'icing', 'sprinkles', 'food coloring'
  ],
  breakfast: [
    'cereal', 'oatmeal', 'pancake mix', 'waffle mix', 'syrup', 'breakfast',
    'granola', 'breakfast bar', 'pop tarts', 'toaster strudel', 'bagel',
    'cream cheese', 'jam', 'jelly'
  ],
  deli: [
    'deli', 'lunch meat', 'sliced turkey', 'sliced ham', 'salami', 'bologna',
    'pepperoni', 'roast beef', 'pastrami', 'prosciutto'
  ],
  health: [
    'vitamin', 'supplement', 'medicine', 'bandage', 'first aid', 'aspirin',
    'ibuprofen', 'acetaminophen', 'cough', 'cold', 'allergy', 'antacid',
    'lotion', 'sunscreen', 'chapstick', 'toothpaste', 'toothbrush', 'floss',
    'mouthwash', 'shampoo', 'conditioner', 'soap', 'deodorant'
  ],
  household: [
    'detergent', 'soap', 'cleaner', 'paper towel', 'toilet paper', 'tissue',
    'trash bag', 'aluminum foil', 'plastic wrap', 'saran wrap', 'ziploc',
    'dishwasher', 'laundry', 'bleach', 'disinfectant', 'wipes', 'sponge',
    'dish soap', 'fabric softener', 'dryer sheets', 'light bulb', 'battery',
    'batteries'
  ],
  baby: [
    'baby', 'infant', 'formula', 'diaper', 'wipes', 'baby food', 'pacifier',
    'bottle', 'sippy cup', 'baby lotion', 'baby powder', 'baby shampoo'
  ],
  pet: [
    'dog food', 'cat food', 'pet food', 'dog treat', 'cat treat', 'pet treat',
    'dog toy', 'cat toy', 'litter', 'cat litter', 'pet supplies', 'bird seed',
    'fish food', 'pet shampoo', 'flea', 'tick'
  ],
};

/**
 * Automatically categorizes an item based on its name
 * @param itemName - The name of the item to categorize
 * @returns The category ID that best matches the item, or 'other' if no match found
 */
export function autoCategorizeItem(itemName: string): string {
  const normalizedName = itemName.toLowerCase().trim();

  // Check each category's keywords
  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword)) {
        return categoryId;
      }
    }
  }

  // If no match found, return 'other'
  return 'other';
}

/**
 * Gets suggested categories for an item (top 3 matches)
 * @param itemName - The name of the item
 * @returns Array of category IDs sorted by relevance
 */
export function getSuggestedCategories(itemName: string): string[] {
  const normalizedName = itemName.toLowerCase().trim();
  const categoryScores: { [key: string]: number } = {};

  // Score each category based on keyword matches
  for (const [categoryId, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedName.includes(keyword)) {
        // Exact match gets higher score
        if (normalizedName === keyword) {
          score += 10;
        } else {
          score += 1;
        }
      }
    }
    if (score > 0) {
      categoryScores[categoryId] = score;
    }
  }

  // Sort categories by score and return top 3
  return Object.entries(categoryScores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([categoryId]) => categoryId);
}
