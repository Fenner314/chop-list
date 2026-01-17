import { IconFamily } from "@/components/dynamic-icon";

export interface FoodIcon {
  name: string;
  family: IconFamily;
  label?: string;
}

export const FOOD_ICONS: FoodIcon[] = [
  // ============ FRUITS ============
  { name: "food-apple", family: "MaterialCommunityIcons" },
  { name: "food-apple-outline", family: "MaterialCommunityIcons" },
  { name: "apple-alt", family: "FontAwesome5" },
  { name: "fruit-cherries", family: "MaterialCommunityIcons" },
  { name: "fruit-citrus", family: "MaterialCommunityIcons" },
  { name: "lemon", family: "FontAwesome5" },
  { name: "fruit-grapes", family: "MaterialCommunityIcons" },
  { name: "fruit-pineapple", family: "MaterialCommunityIcons" },
  { name: "fruit-watermelon", family: "MaterialCommunityIcons" },

  // ============ VEGETABLES ============
  { name: "carrot", family: "MaterialCommunityIcons" },
  { name: "carrot", family: "FontAwesome5" },
  { name: "corn", family: "MaterialCommunityIcons" },
  { name: "mushroom", family: "MaterialCommunityIcons" },
  { name: "pumpkin", family: "MaterialCommunityIcons" },
  { name: "nutrition", family: "MaterialCommunityIcons" },
  { name: "nutrition-outline", family: "Ionicons" },

  // ============ HERBS, LEAVES & PLANTS ============
  { name: "leaf", family: "MaterialCommunityIcons" },
  { name: "leaf", family: "FontAwesome5" },
  { name: "leaf-outline", family: "Ionicons" },
  { name: "leaf-maple", family: "MaterialCommunityIcons" },
  { name: "leaf-circle", family: "MaterialCommunityIcons" },
  { name: "leaf-circle-outline", family: "MaterialCommunityIcons" },
  { name: "sprout", family: "MaterialCommunityIcons" },
  { name: "sprout-outline", family: "MaterialCommunityIcons" },
  { name: "seedling", family: "FontAwesome5" },
  { name: "seed", family: "MaterialCommunityIcons" },
  { name: "seed-outline", family: "MaterialCommunityIcons" },
  { name: "flower", family: "MaterialCommunityIcons" },
  { name: "flower-outline", family: "MaterialCommunityIcons" },

  // ============ SPICES & PEPPERS ============
  { name: "chili-mild", family: "MaterialCommunityIcons" },
  { name: "chili-medium", family: "MaterialCommunityIcons" },
  { name: "chili-hot", family: "MaterialCommunityIcons" },
  { name: "chili-off", family: "MaterialCommunityIcons" },
  { name: "pepper-hot", family: "FontAwesome5" },
  { name: "shaker", family: "MaterialCommunityIcons" },
  { name: "shaker-outline", family: "MaterialCommunityIcons" },

  // ============ EGGS ============
  { name: "egg", family: "MaterialCommunityIcons" },
  { name: "egg-outline", family: "MaterialCommunityIcons" },
  { name: "egg-fried", family: "MaterialCommunityIcons" },
  { name: "egg-off", family: "MaterialCommunityIcons" },
  { name: "egg-off-outline", family: "MaterialCommunityIcons" },
  { name: "egg", family: "FontAwesome5" },
  { name: "egg", family: "Ionicons" },
  { name: "egg-outline", family: "Ionicons" },
  { name: "egg", family: "MaterialIcons" },
  { name: "egg-alt", family: "MaterialIcons" },

  // ============ DAIRY ============
  { name: "cheese", family: "MaterialCommunityIcons" },
  { name: "cheese", family: "FontAwesome5" },

  // ============ MEAT & POULTRY ============
  { name: "food-steak", family: "MaterialCommunityIcons" },
  { name: "food-drumstick", family: "MaterialCommunityIcons" },
  { name: "drumstick-bite", family: "FontAwesome5" },
  { name: "food-turkey", family: "MaterialCommunityIcons" },
  { name: "sausage", family: "MaterialCommunityIcons" },
  { name: "bacon", family: "FontAwesome5" },
  { name: "cow", family: "MaterialCommunityIcons" },
  { name: "pig", family: "MaterialCommunityIcons" },
  { name: "pig-variant", family: "MaterialCommunityIcons" },

  // ============ FISH & SEAFOOD ============
  { name: "fish", family: "MaterialCommunityIcons" },
  { name: "fish", family: "FontAwesome5" },
  { name: "fish-outline", family: "Ionicons" },

  // ============ GRAINS & RICE ============
  { name: "barley", family: "MaterialCommunityIcons" },
  { name: "grain", family: "MaterialCommunityIcons" },
  { name: "rice", family: "MaterialCommunityIcons" },
  { name: "rice-bowl", family: "MaterialIcons" },

  // ============ BREAD ============
  { name: "bread-slice", family: "MaterialCommunityIcons" },
  { name: "bread-slice-outline", family: "MaterialCommunityIcons" },
  { name: "bread-slice", family: "FontAwesome5" },
  { name: "baguette", family: "MaterialCommunityIcons" },
  { name: "food-croissant", family: "MaterialCommunityIcons" },
  { name: "pretzel", family: "MaterialCommunityIcons" },

  // ============ PASTA & NOODLES ============
  { name: "pasta", family: "MaterialCommunityIcons" },
  { name: "noodles", family: "MaterialCommunityIcons" },
  { name: "ramen-dining", family: "MaterialIcons" },

  // ============ BAKED GOODS & CAKES ============
  { name: "muffin", family: "MaterialCommunityIcons" },
  { name: "cupcake", family: "MaterialCommunityIcons" },
  { name: "cake", family: "MaterialCommunityIcons" },
  { name: "cake-variant", family: "MaterialCommunityIcons" },
  { name: "cake-layered", family: "MaterialCommunityIcons" },
  { name: "cake", family: "MaterialIcons" },
  { name: "birthday-cake", family: "FontAwesome5" },
  { name: "bakery-dining", family: "MaterialIcons" },
  { name: "stroopwafel", family: "FontAwesome5" },

  // ============ COOKIES & SWEETS ============
  { name: "cookie", family: "MaterialCommunityIcons" },
  { name: "cookie-outline", family: "MaterialCommunityIcons" },
  { name: "cookie-bite", family: "FontAwesome5" },
  { name: "candy", family: "MaterialCommunityIcons" },
  { name: "candy-outline", family: "MaterialCommunityIcons" },
  { name: "candy-off", family: "MaterialCommunityIcons" },
  { name: "candy-off-outline", family: "MaterialCommunityIcons" },
  { name: "candy-cane", family: "FontAwesome5" },

  // ============ ICE CREAM & FROZEN ============
  { name: "ice-cream", family: "MaterialCommunityIcons" },
  { name: "ice-cream", family: "FontAwesome5" },
  { name: "ice-cream-outline", family: "Ionicons" },
  { name: "icecream", family: "MaterialIcons" },
  { name: "ice-pop", family: "MaterialCommunityIcons" },
  { name: "snowflake", family: "MaterialCommunityIcons" },
  { name: "snow-outline", family: "Ionicons" },
  { name: "ac-unit", family: "MaterialIcons" },

  // ============ SNACKS ============
  { name: "popcorn", family: "MaterialCommunityIcons" },
  { name: "peanut", family: "MaterialCommunityIcons" },
  { name: "french-fries", family: "MaterialCommunityIcons" },

  // ============ CONDIMENTS & SAUCES ============
  { name: "soy-sauce", family: "MaterialCommunityIcons" },

  // ============ FAST FOOD ============
  { name: "pizza", family: "MaterialCommunityIcons" },
  { name: "pizza", family: "Ionicons" },
  { name: "pizza-outline", family: "Ionicons" },
  { name: "pizza-slice", family: "FontAwesome5" },
  { name: "local-pizza", family: "MaterialIcons" },
  { name: "hamburger", family: "MaterialCommunityIcons" },
  { name: "hamburger", family: "FontAwesome5" },
  { name: "food-hot-dog", family: "MaterialCommunityIcons" },
  { name: "hotdog", family: "FontAwesome5" },
  { name: "taco", family: "MaterialCommunityIcons" },
  { name: "fast-food", family: "Ionicons" },
  { name: "fast-food-outline", family: "Ionicons" },
  { name: "food-takeout-box", family: "MaterialCommunityIcons" },

  // ============ GENERAL FOOD ============
  { name: "food-variant", family: "MaterialCommunityIcons" },
  { name: "food-variant-off", family: "MaterialCommunityIcons" },
  { name: "food-off", family: "MaterialCommunityIcons" },
  { name: "food-off-outline", family: "MaterialCommunityIcons" },
  { name: "food-fork-drink", family: "MaterialCommunityIcons" },
  { name: "food-halal", family: "MaterialCommunityIcons" },
  { name: "food-kosher", family: "MaterialCommunityIcons" },
  { name: "emoji-food-beverage", family: "MaterialIcons" },

  // ============ DINING & RESTAURANTS ============
  { name: "restaurant", family: "Ionicons" },
  { name: "restaurant-outline", family: "Ionicons" },
  { name: "restaurant", family: "MaterialIcons" },
  { name: "restaurant-menu", family: "MaterialIcons" },
  { name: "local-dining", family: "MaterialIcons" },
  { name: "breakfast-dining", family: "MaterialIcons" },
  { name: "brunch-dining", family: "MaterialIcons" },
  { name: "lunch-dining", family: "MaterialIcons" },
  { name: "dinner-dining", family: "MaterialIcons" },
  { name: "set-meal", family: "MaterialIcons" },
  { name: "bento", family: "MaterialIcons" },
  { name: "tapas", family: "MaterialIcons" },
  { name: "kebab-dining", family: "MaterialIcons" },
  { name: "soup-kitchen", family: "MaterialIcons" },

  // ============ COFFEE & TEA ============
  { name: "coffee", family: "MaterialCommunityIcons" },
  { name: "coffee-outline", family: "MaterialCommunityIcons" },
  { name: "coffee-to-go", family: "MaterialCommunityIcons" },
  { name: "coffee-to-go-outline", family: "MaterialCommunityIcons" },
  { name: "coffee", family: "FontAwesome5" },
  { name: "coffee", family: "Feather" },
  { name: "mug-hot", family: "FontAwesome5" },
  { name: "cafe", family: "Ionicons" },
  { name: "cafe-outline", family: "Ionicons" },
  { name: "local-cafe", family: "MaterialIcons" },
  { name: "tea", family: "MaterialCommunityIcons" },
  { name: "tea-outline", family: "MaterialCommunityIcons" },

  // ============ CUPS & MUGS ============
  { name: "cup", family: "MaterialCommunityIcons" },
  { name: "cup-outline", family: "MaterialCommunityIcons" },
  { name: "cup-water", family: "MaterialCommunityIcons" },
  { name: "cup-off", family: "MaterialCommunityIcons" },
  { name: "cup-off-outline", family: "MaterialCommunityIcons" },

  // ============ WATER & DRINKS ============
  { name: "water", family: "MaterialCommunityIcons" },
  { name: "water-outline", family: "Ionicons" },
  { name: "droplet", family: "Feather" },
  { name: "local-drink", family: "MaterialIcons" },

  // ============ BEER ============
  { name: "beer", family: "MaterialCommunityIcons" },
  { name: "beer-outline", family: "MaterialCommunityIcons" },
  { name: "beer", family: "FontAwesome5" },
  { name: "beer-outline", family: "Ionicons" },
  { name: "hops", family: "MaterialCommunityIcons" },
  { name: "sports-bar", family: "MaterialIcons" },

  // ============ WINE ============
  { name: "bottle-wine", family: "MaterialCommunityIcons" },
  { name: "bottle-wine-outline", family: "MaterialCommunityIcons" },
  { name: "wine-bottle", family: "FontAwesome5" },
  { name: "glass-wine", family: "MaterialCommunityIcons" },
  { name: "wine-glass", family: "FontAwesome5" },
  { name: "wine-glass-alt", family: "FontAwesome5" },
  { name: "wine", family: "Ionicons" },
  { name: "wine-outline", family: "Ionicons" },
  { name: "wine-bar", family: "MaterialIcons" },

  // ============ COCKTAILS & SPIRITS ============
  { name: "glass-cocktail", family: "MaterialCommunityIcons" },
  { name: "cocktail", family: "FontAwesome5" },
  { name: "glass-martini", family: "FontAwesome5" },
  { name: "glass-martini-alt", family: "FontAwesome5" },
  { name: "glass-whiskey", family: "FontAwesome5" },
  { name: "glass-cheers", family: "FontAwesome5" },
  { name: "glass-tulip", family: "MaterialCommunityIcons" },
  { name: "glass-flute", family: "MaterialCommunityIcons" },
  { name: "glass-mug", family: "MaterialCommunityIcons" },
  { name: "glass-mug-variant", family: "MaterialCommunityIcons" },
  { name: "glass-pint-outline", family: "MaterialCommunityIcons" },
  { name: "glass-stange", family: "MaterialCommunityIcons" },
  { name: "liquor", family: "MaterialCommunityIcons" },
  { name: "liquor", family: "MaterialIcons" },
  { name: "local-bar", family: "MaterialIcons" },
  { name: "nightlife", family: "MaterialIcons" },

  // ============ BOTTLES & SODA ============
  { name: "bottle-soda", family: "MaterialCommunityIcons" },
  { name: "bottle-soda-outline", family: "MaterialCommunityIcons" },
  { name: "bottle-soda-classic", family: "MaterialCommunityIcons" },
  { name: "bottle-soda-classic-outline", family: "MaterialCommunityIcons" },
  { name: "bottle-tonic", family: "MaterialCommunityIcons" },
  { name: "bottle-tonic-outline", family: "MaterialCommunityIcons" },

  // ============ KITCHEN APPLIANCES ============
  { name: "fridge", family: "MaterialCommunityIcons" },
  { name: "fridge-outline", family: "MaterialCommunityIcons" },
  { name: "fridge-industrial", family: "MaterialCommunityIcons" },
  { name: "fridge-industrial-outline", family: "MaterialCommunityIcons" },
  { name: "stove", family: "MaterialCommunityIcons" },
  { name: "microwave", family: "MaterialCommunityIcons" },
  { name: "microwave", family: "MaterialIcons" },
  { name: "toaster", family: "MaterialCommunityIcons" },
  { name: "toaster-oven", family: "MaterialCommunityIcons" },
  { name: "toaster-off", family: "MaterialCommunityIcons" },
  { name: "blender", family: "MaterialCommunityIcons" },
  { name: "blender-outline", family: "MaterialCommunityIcons" },
  { name: "blender", family: "FontAwesome5" },
  { name: "blender", family: "MaterialIcons" },
  { name: "coffee-maker", family: "MaterialCommunityIcons" },
  { name: "coffee-maker-outline", family: "MaterialCommunityIcons" },
  { name: "kettle", family: "MaterialCommunityIcons" },
  { name: "kettle-outline", family: "MaterialCommunityIcons" },
  { name: "kettle-steam", family: "MaterialCommunityIcons" },
  { name: "kettle-steam-outline", family: "MaterialCommunityIcons" },
  { name: "dishwasher", family: "MaterialCommunityIcons" },
  { name: "dishwasher-alert", family: "MaterialCommunityIcons" },
  { name: "dishwasher-off", family: "MaterialCommunityIcons" },
  { name: "kitchen", family: "MaterialIcons" },

  // ============ COOKWARE ============
  { name: "pot", family: "MaterialCommunityIcons" },
  { name: "pot-outline", family: "MaterialCommunityIcons" },
  { name: "pot-steam", family: "MaterialCommunityIcons" },
  { name: "pot-steam-outline", family: "MaterialCommunityIcons" },
  { name: "pot-mix", family: "MaterialCommunityIcons" },
  { name: "pot-mix-outline", family: "MaterialCommunityIcons" },
  { name: "bowl", family: "MaterialCommunityIcons" },
  { name: "bowl-outline", family: "MaterialCommunityIcons" },
  { name: "bowl-mix", family: "MaterialCommunityIcons" },
  { name: "bowl-mix-outline", family: "MaterialCommunityIcons" },

  // ============ GRILLS ============
  { name: "grill", family: "MaterialCommunityIcons" },
  { name: "grill-outline", family: "MaterialCommunityIcons" },
  { name: "outdoor-grill", family: "MaterialIcons" },

  // ============ UTENSILS ============
  { name: "silverware", family: "MaterialCommunityIcons" },
  { name: "silverware-fork", family: "MaterialCommunityIcons" },
  { name: "silverware-fork-knife", family: "MaterialCommunityIcons" },
  { name: "silverware-spoon", family: "MaterialCommunityIcons" },
  { name: "silverware-variant", family: "MaterialCommunityIcons" },
  { name: "silverware-clean", family: "MaterialCommunityIcons" },
  { name: "utensils", family: "FontAwesome5" },
  { name: "utensil-spoon", family: "FontAwesome5" },
  { name: "knife", family: "MaterialCommunityIcons" },
  { name: "mortar-pestle", family: "FontAwesome5" },
  { name: "scissors", family: "Feather" },

  // ============ HEAT & FIRE ============
  { name: "fire", family: "MaterialCommunityIcons" },
  { name: "fire", family: "FontAwesome5" },
  { name: "fire-alt", family: "FontAwesome5" },
  { name: "flame", family: "Ionicons" },
  { name: "flame-outline", family: "Ionicons" },
  { name: "whatshot", family: "MaterialIcons" },
  { name: "campfire", family: "MaterialCommunityIcons" },

  // ============ TEMPERATURE ============
  { name: "thermometer", family: "MaterialCommunityIcons" },
  { name: "thermometer-lines", family: "MaterialCommunityIcons" },
  { name: "thermometer-half", family: "FontAwesome5" },
  { name: "thermometer", family: "Feather" },

  // ============ SCALES & MEASUREMENT ============
  { name: "scale", family: "MaterialCommunityIcons" },
  { name: "scale-balance", family: "MaterialCommunityIcons" },
  { name: "scale", family: "MaterialIcons" },
  { name: "weight", family: "FontAwesome5" },
  { name: "balance-scale", family: "FontAwesome5" },
  { name: "balance-scale-left", family: "FontAwesome5" },
  { name: "balance-scale-right", family: "FontAwesome5" },

  // ============ TIMERS ============
  { name: "timer", family: "MaterialCommunityIcons" },
  { name: "timer-outline", family: "MaterialCommunityIcons" },
  { name: "timer-sand", family: "MaterialCommunityIcons" },
  { name: "timer", family: "MaterialIcons" },
  { name: "clock", family: "Feather" },

  // ============ SHOPPING - BASKETS ============
  { name: "basket", family: "MaterialCommunityIcons" },
  { name: "basket-outline", family: "MaterialCommunityIcons" },
  { name: "basket-fill", family: "MaterialCommunityIcons" },
  { name: "basket-outline", family: "Ionicons" },
  { name: "shopping-basket", family: "FontAwesome5" },
  { name: "shopping-basket", family: "MaterialIcons" },

  // ============ SHOPPING - CARTS ============
  { name: "cart", family: "MaterialCommunityIcons" },
  { name: "cart-outline", family: "MaterialCommunityIcons" },
  { name: "cart", family: "Ionicons" },
  { name: "cart-outline", family: "Ionicons" },
  { name: "shopping-cart", family: "FontAwesome5" },
  { name: "shopping-cart", family: "MaterialIcons" },
  { name: "shopping-cart", family: "Feather" },
  { name: "shopping-bag", family: "Feather" },

  // ============ STORES ============
  { name: "store", family: "MaterialCommunityIcons" },
  { name: "store", family: "FontAwesome5" },
  { name: "store-alt", family: "FontAwesome5" },
  { name: "store", family: "MaterialIcons" },
  { name: "storefront", family: "MaterialCommunityIcons" },
  { name: "storefront-outline", family: "MaterialCommunityIcons" },
  { name: "storefront", family: "MaterialIcons" },
  { name: "storefront-outline", family: "Ionicons" },
  { name: "local-grocery-store", family: "MaterialIcons" },

  // ============ RECEIPTS & PAYMENTS ============
  { name: "receipt", family: "MaterialCommunityIcons" },
  { name: "receipt-outline", family: "Ionicons" },
  { name: "cash-register", family: "MaterialCommunityIcons" },

  // ============ STORAGE & PACKAGING ============
  { name: "package", family: "Feather" },
  { name: "box", family: "Feather" },
  { name: "trash-2", family: "Feather" },

  // ============ HONEY & BEES ============
  { name: "bee", family: "MaterialCommunityIcons" },
  { name: "beehive-outline", family: "MaterialCommunityIcons" },

  // ============ BABY ============
  { name: "baby-bottle", family: "MaterialCommunityIcons" },
  { name: "baby-carriage", family: "MaterialCommunityIcons" },

  // ============ PETS ============
  { name: "paw", family: "MaterialCommunityIcons" },
  { name: "dog", family: "MaterialCommunityIcons" },
  { name: "cat", family: "MaterialCommunityIcons" },

  // ============ CLEANING & SAFETY ============
  { name: "spray-bottle", family: "MaterialCommunityIcons" },
  { name: "health-and-safety", family: "MaterialIcons" },

  // ============ MISC ============
  { name: "shapes", family: "FontAwesome5" },
];

// Helper function to get icon family by name
export function getIconFamily(iconName: string): IconFamily {
  const icon = FOOD_ICONS.find((icon) => icon.name === iconName);

  if (icon?.name === "bacon") {
    console.log({ icon });
  }
  return icon?.family || "MaterialCommunityIcons";
}
