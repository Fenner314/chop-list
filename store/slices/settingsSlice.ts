import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SettingsState {
  // General Settings
  themeColor: string;
  fontSize: 'small' | 'medium' | 'large';
  darkMode: boolean;

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

const initialState: SettingsState = {
  themeColor: '#007AFF',
  fontSize: 'medium',
  darkMode: false,
  shoppingListSettings: {
    sortBy: 'manual',
    showCompleted: true,
    clearCompletedOnExit: false,
  },
  pantryListSettings: {
    sortBy: 'manual',
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
    setThemeColor: (state, action: PayloadAction<string>) => {
      state.themeColor = action.payload;
    },
    setFontSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.fontSize = action.payload;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
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
  setThemeColor,
  setFontSize,
  setDarkMode,
  updateShoppingListSettings,
  updatePantryListSettings,
  updateRecipesSettings,
  updateAccountSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
