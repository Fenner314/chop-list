import { DEFAULT_CATEGORIES } from "@/constants/default-categories";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface SettingsState {
  // General Settings
  themeColor: string;
  fontSize: "small" | "medium" | "large";
  darkMode: boolean;
  lastVisitedTab: "shopping-list" | "pantry-list" | "recipes";

  // Categories for items
  categories: Category[];

  // Shopping List Settings
  shoppingListSettings: {
    sortBy: "manual" | "alphabetical" | "category";
    showCompleted: boolean;
    clearCompletedOnExit: boolean;
    addAnotherItem: boolean;
    addCompletedToPantry: boolean;
  };

  // Pantry List Settings
  pantryListSettings: {
    sortBy: "manual" | "alphabetical" | "category" | "expiration";
    showExpired: boolean;
    expirationWarningDays: number;
    addAnotherItem: boolean;
    showEmptyCategories: boolean;
  };

  // Recipes Settings
  recipesSettings: {
    sortBy: "manual" | "alphabetical" | "date";
    defaultServings: number;
  };

  // Account Settings
  accountSettings: {
    username: string;
    email: string;
    syncEnabled: boolean;
  };
}

const initialState: SettingsState = {
  themeColor: "#007AFF",
  fontSize: "medium",
  darkMode: false,
  lastVisitedTab: "pantry-list",
  categories: DEFAULT_CATEGORIES,
  shoppingListSettings: {
    sortBy: "manual",
    showCompleted: true,
    clearCompletedOnExit: false,
    addAnotherItem: true,
    addCompletedToPantry: true,
  },
  pantryListSettings: {
    sortBy: "category",
    showExpired: true,
    expirationWarningDays: 7,
    addAnotherItem: true,
    showEmptyCategories: false,
  },
  recipesSettings: {
    sortBy: "alphabetical",
    defaultServings: 4,
  },
  accountSettings: {
    username: "",
    email: "",
    syncEnabled: false,
  },
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    // Initialize categories if they don't exist (for migration from old state)
    initializeCategories: (state) => {
      // if (!state.categories || state.categories.length === 0) {
      state.categories = DEFAULT_CATEGORIES;
      // }
    },
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
    },
    setFontSize: (
      state,
      action: PayloadAction<"small" | "medium" | "large">
    ) => {
      state.fontSize = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
    setLastVisitedTab: (
      state,
      action: PayloadAction<"shopping-list" | "pantry-list" | "recipes">
    ) => {
      state.lastVisitedTab = action.payload;
    },
    addCategory: (state, action: PayloadAction<Omit<Category, "id">>) => {
      const newCategory: Category = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.categories.push(newCategory);
    },
    updateCategory: (state, action: PayloadAction<Category>) => {
      const index = state.categories.findIndex(
        (cat) => cat.id === action.payload.id
      );
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    deleteCategory: (state, action: PayloadAction<string>) => {
      state.categories = state.categories.filter(
        (cat) => cat.id !== action.payload
      );
    },
    updateShoppingListSettings: (
      state,
      action: PayloadAction<Partial<SettingsState["shoppingListSettings"]>>
    ) => {
      state.shoppingListSettings = {
        ...state.shoppingListSettings,
        ...action.payload,
      };
    },
    updatePantryListSettings: (
      state,
      action: PayloadAction<Partial<SettingsState["pantryListSettings"]>>
    ) => {
      state.pantryListSettings = {
        ...state.pantryListSettings,
        ...action.payload,
      };
    },
    updateRecipesSettings: (
      state,
      action: PayloadAction<Partial<SettingsState["recipesSettings"]>>
    ) => {
      state.recipesSettings = { ...state.recipesSettings, ...action.payload };
    },
    updateAccountSettings: (
      state,
      action: PayloadAction<Partial<SettingsState["accountSettings"]>>
    ) => {
      state.accountSettings = { ...state.accountSettings, ...action.payload };
    },
  },
});

export const {
  initializeCategories,
  setThemeColor,
  setFontSize,
  setDarkMode,
  setLastVisitedTab,
  addCategory,
  updateCategory,
  deleteCategory,
  updateShoppingListSettings,
  updatePantryListSettings,
  updateRecipesSettings,
  updateAccountSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
