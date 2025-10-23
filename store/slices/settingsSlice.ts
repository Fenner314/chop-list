import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface SettingsState {
  // General Settings
  themeColor: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;

  // Categories for items
  categories: Category[];

  // Shopping List Settings
  shoppingListSettings: {
    sortBy: 'manual' | 'alphabetical' | 'category';
    showCompleted: boolean;
    clearCompletedOnExit: boolean;
  };

  // Pantry List Settings
  pantryListSettings: {
    sortBy: 'manual' | 'alphabetical' | 'category' | 'expiration';
    showExpired: boolean;
    expirationWarningDays: number;
  };

  // Recipes Settings
  recipesSettings: {
    sortBy: 'manual' | 'alphabetical' | 'date';
    defaultServings: number;
  };

  // Account Settings
  accountSettings: {
    username: string;
    email: string;
    syncEnabled: boolean;
  };
}

// Default categories inspired by Out of Milk
const DEFAULT_CATEGORIES: Category[] = [
  { id: 'dairy', name: 'Dairy & Eggs', color: '#FFF9C4' },
  { id: 'produce', name: 'Fruits & Vegetables', color: '#C8E6C9' },
  { id: 'meat', name: 'Meat & Seafood', color: '#FFCDD2' },
  { id: 'bakery', name: 'Bakery & Bread', color: '#FFE0B2' },
  { id: 'frozen', name: 'Frozen Foods', color: '#B3E5FC' },
  { id: 'canned', name: 'Canned Goods', color: '#D7CCC8' },
  { id: 'beverages', name: 'Beverages', color: '#F8BBD0' },
  { id: 'snacks', name: 'Snacks', color: '#FFCCBC' },
  { id: 'pantry', name: 'Pantry Staples', color: '#FFF59D' },
  { id: 'spices', name: 'Spices & Seasonings', color: '#FFAB91' },
  { id: 'condiments', name: 'Condiments & Sauces', color: '#EF9A9A' },
  { id: 'grains', name: 'Grains & Pasta', color: '#E6EE9C' },
  { id: 'baking', name: 'Baking Supplies', color: '#FFECB3' },
  { id: 'breakfast', name: 'Breakfast Foods', color: '#FFE082' },
  { id: 'deli', name: 'Deli', color: '#FFCC80' },
  { id: 'health', name: 'Health & Personal Care', color: '#C5E1A5' },
  { id: 'household', name: 'Household Items', color: '#B0BEC5' },
  { id: 'baby', name: 'Baby Products', color: '#F48FB1' },
  { id: 'pet', name: 'Pet Supplies', color: '#CE93D8' },
  { id: 'other', name: 'Other', color: '#E0E0E0' },
];

const initialState: SettingsState = {
  themeColor: '#007AFF',
  fontSize: 'medium',
  darkMode: false,
  categories: DEFAULT_CATEGORIES,
  shoppingListSettings: {
    sortBy: 'manual',
    showCompleted: true,
    clearCompletedOnExit: false,
  },
  pantryListSettings: {
    sortBy: 'category',
    showExpired: true,
    expirationWarningDays: 7,
  },
  recipesSettings: {
    sortBy: 'alphabetical',
    defaultServings: 4,
  },
  accountSettings: {
    username: '',
    email: '',
    syncEnabled: false,
  },
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Initialize categories if they don't exist (for migration from old state)
    initializeCategories: (state) => {
      if (!state.categories || state.categories.length === 0) {
        state.categories = DEFAULT_CATEGORIES;
      }
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    addCategory: (state, action: PayloadAction<Omit<Category, 'id'>>) => {
      const newCategory: Category = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.categories.push(newCategory);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(cat => cat.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(cat => cat.id !== action.payload);
    },
    updateShoppingListSettings: (state, action: PayloadAction<Partial<SettingsState['shoppingListSettings']>>) => {
      state.shoppingListSettings = { ...state.shoppingListSettings, ...action.payload };
    },
    updatePantryListSettings: (state, action: PayloadAction<Partial<SettingsState['pantryListSettings']>>) => {
      state.pantryListSettings = { ...state.pantryListSettings, ...action.payload };
    },
    updateRecipesSettings: (state, action: PayloadAction<Partial<SettingsState['recipesSettings']>>) => {
      state.recipesSettings = { ...state.recipesSettings, ...action.payload };
    },
    updateAccountSettings: (state, action: PayloadAction<Partial<SettingsState['accountSettings']>>) => {
      state.accountSettings = { ...state.accountSettings, ...action.payload };
    },
  },
});

export const {
  initializeCategories,
  setThemeColor,
  setFontSize,
  setDarkMode,
  addCategory,
  updateCategory,
  deleteCategory,
  updateShoppingListSettings,
  updatePantryListSettings,
  updateRecipesSettings,
  updateAccountSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
