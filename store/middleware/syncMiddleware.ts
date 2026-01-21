import { Middleware } from '@reduxjs/toolkit';
import { syncService } from '@/services/syncService';
import { Item } from '@/store/slices/itemsSlice';
import { Recipe } from '@/store/slices/recipesSlice';

// Track if we're currently syncing from Firebase to prevent loops
let isSyncingFromFirebase = false;

export const setSyncingFromFirebase = (value: boolean) => {
  isSyncingFromFirebase = value;
};

// Actions that modify items and need to sync
const itemSyncActions = [
  'items/addItemToList',
  'items/removeItemFromList',
  'items/updateItem',
  'items/updatePantryMetadata',
  'items/updateShoppingMetadata',
  'items/toggleShoppingCompleted',
  'items/updateItemCategory',
  'items/reorderPantryItems',
  'items/reorderShoppingItems',
  'items/clearCompletedShopping',
  'items/uncheckAllShopping',
  'items/clearExpiredPantry',
  'items/clearAllFromList',
  'items/clearAllItems',
  'items/subtractRecipeFromPantry',
];

// Actions that modify recipes and need to sync
const recipeSyncActions = [
  'recipes/addRecipe',
  'recipes/updateRecipe',
  'recipes/deleteRecipe',
  'recipes/toggleFavorite',
];

// Actions that come from Firebase (don't sync these back)
const syncFromFirebaseActions = [
  'items/setAllItems',
  'recipes/setAllRecipes',
];

export const syncMiddleware: Middleware = (store) => (next) => (action: any) => {
  // Execute the action first
  const result = next(action);

  // Skip if we're receiving data from Firebase (prevents loops)
  if (isSyncingFromFirebase) {
    return result;
  }

  // Skip setAll actions (these come from Firebase)
  if (syncFromFirebaseActions.includes(action.type)) {
    return result;
  }

  // Check if sharing is enabled
  const state = store.getState();
  const sharingEnabled = state.settings?.sharingEnabled;

  if (!sharingEnabled) {
    return result;
  }

  // Handle item sync actions
  if (itemSyncActions.includes(action.type)) {
    console.log('[SyncMiddleware] Item action detected:', action.type);
    const items: Item[] = state.items?.items || [];

    // For bulk operations, sync all affected items
    if (action.type === 'items/clearCompletedShopping' ||
        action.type === 'items/uncheckAllShopping' ||
        action.type === 'items/clearExpiredPantry' ||
        action.type === 'items/clearAllFromList' ||
        action.type === 'items/clearAllItems' ||
        action.type === 'items/reorderPantryItems' ||
        action.type === 'items/reorderShoppingItems') {
      // Sync all items for bulk operations
      items.forEach((item) => {
        syncService.pushItemChange(item).catch(console.error);
      });
    } else if (action.type === 'items/removeItemFromList') {
      // Check if item was completely removed or just from one list
      const { itemId } = action.payload;
      const item = items.find((i) => i.id === itemId);
      if (item) {
        // Item still exists (removed from one list but still in another)
        syncService.pushItemChange(item).catch(console.error);
      } else {
        // Item was completely removed
        syncService.pushItemDelete(itemId).catch(console.error);
      }
    } else {
      // For single item operations, find and sync the affected item
      let itemId: string | undefined;

      if (action.payload?.itemId) {
        itemId = action.payload.itemId;
      } else if (action.payload?.name) {
        // For addItemToList, find by name (case-insensitive)
        const name = action.payload.name.toLowerCase();
        const item = items.find((i) => i.name.toLowerCase() === name);
        itemId = item?.id;
      }

      if (itemId) {
        const item = items.find((i) => i.id === itemId);
        if (item) {
          syncService.pushItemChange(item).catch(console.error);
        }
      }
    }
  }

  // Handle recipe sync actions
  if (recipeSyncActions.includes(action.type)) {
    const recipes: Recipe[] = state.recipes?.recipes || [];

    if (action.type === 'recipes/deleteRecipe') {
      syncService.pushRecipeDelete(action.payload).catch(console.error);
    } else {
      // For add/update/toggle, find and sync the affected recipe
      let recipeId: string | undefined;

      if (action.type === 'recipes/addRecipe') {
        // Find the newly added recipe (last one with matching name)
        const name = action.payload.name;
        const recipe = recipes.find((r) => r.name === name);
        recipeId = recipe?.id;
      } else if (action.type === 'recipes/toggleFavorite') {
        recipeId = action.payload;
      } else {
        recipeId = action.payload?.id;
      }

      if (recipeId) {
        const recipe = recipes.find((r) => r.id === recipeId);
        if (recipe) {
          syncService.pushRecipeChange(recipe).catch(console.error);
        }
      }
    }
  }

  return result;
};
