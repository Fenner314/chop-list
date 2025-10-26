import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import settingsReducer from './slices/settingsSlice';
import shoppingListReducer from './slices/shoppingListSlice';
import pantryListReducer from './slices/pantryListSlice';
import recipesReducer from './slices/recipesSlice';
import itemsReducer from './slices/itemsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
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
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
