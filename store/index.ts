import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import settingsReducer from './slices/settingsSlice';
import shoppingListReducer from './slices/shoppingListSlice';
import pantryListReducer from './slices/pantryListSlice';
import recipesReducer from './slices/recipesSlice';
import itemsReducer from './slices/itemsSlice';
import { migrateToItemsSlice } from './migrations/migrateToItemsSlice';
import { syncMiddleware } from './middleware/syncMiddleware';

// Migration function to move from separate lists to centralized items
const migrations = {
  0: (state: any) => {
    // If items doesn't exist or is empty, migrate from old slices
    if (!state.items || !state.items.items || state.items.items.length === 0) {
      const pantryItems = state.pantryList?.items || [];
      const shoppingItems = state.shoppingList?.items || [];

      // Migrate items to centralized store
      const migratedItems = migrateToItemsSlice(pantryItems, shoppingItems);

      return {
        ...state,
        items: {
          items: migratedItems,
        },
      };
    }
    return state;
  },
};

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: 0,
  migrate: createMigrate(migrations, { debug: false }),
  whitelist: ['settings', 'shoppingList', 'pantryList', 'recipes', 'items'],
};

const rootReducer = combineReducers({
  settings: settingsReducer,
  shoppingList: shoppingListReducer,
  pantryList: pantryListReducer,
  recipes: recipesReducer,
  items: itemsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(syncMiddleware),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
