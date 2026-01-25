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
  'recipes/removeRecipe',
  'recipes/toggleFavorite',
];

// Actions that come from Firebase (don't sync these back)
const syncFromFirebaseActions = [
  'items/setAllItems',
  'recipes/setAllRecipes',
];

// Actions that may delete items (need to capture state before action)
const itemDeletionActions = [
  'items/clearCompletedShopping',
  'items/clearExpiredPantry',
  'items/clearAllFromList',
  'items/clearAllItems',
  'items/removeItemFromList',
];

export const syncMiddleware: Middleware = (store) => (next) => (action: any) => {
  // Capture items BEFORE the action for deletion detection
  const stateBefore = store.getState();
  const itemsBefore: Item[] = stateBefore.items?.items || [];
  const sharingEnabledBefore = stateBefore.settings?.sharingEnabled;

  // Execute the action
  const result = next(action);

  // Skip if we're receiving data from Firebase (prevents loops)
  if (isSyncingFromFirebase) {
    return result;
  }

  // Skip setAll actions (these come from Firebase)
  if (syncFromFirebaseActions.includes(action.type)) {
    return result;
  }

  // Check if sharing is enabled (use before state to ensure we sync deletions even if sharing was just disabled)
  if (!sharingEnabledBefore) {
    return result;
  }

  // Handle item sync actions
  if (itemSyncActions.includes(action.type)) {
    console.log('[SyncMiddleware] Item action detected:', action.type);
    const stateAfter = store.getState();
    const itemsAfter: Item[] = stateAfter.items?.items || [];

    // For bulk deletion operations, find and sync deleted items
    if (itemDeletionActions.includes(action.type)) {
      // Find items that were completely deleted
      const deletedItemIds = itemsBefore
        .filter((itemBefore) => !itemsAfter.find((itemAfter) => itemAfter.id === itemBefore.id))
        .map((item) => item.id);

      // Push deletions for completely removed items
      deletedItemIds.forEach((itemId) => {
        console.log('[SyncMiddleware] Pushing item deletion:', itemId);
        syncService.pushItemDelete(itemId).catch(console.error);
      });

      // Find items that were modified (still exist but may have changed)
      const modifiedItems = itemsAfter.filter((itemAfter) => {
        const itemBefore = itemsBefore.find((i) => i.id === itemAfter.id);
        // Item exists in both states - check if it changed
        return itemBefore && JSON.stringify(itemBefore) !== JSON.stringify(itemAfter);
      });

      // Push changes for modified items
      modifiedItems.forEach((item) => {
        console.log('[SyncMiddleware] Pushing item change:', item.name);
        syncService.pushItemChange(item).catch(console.error);
      });

      return result;
    }

    // For reorder and uncheck operations, sync all affected items
    if (action.type === 'items/uncheckAllShopping' ||
        action.type === 'items/reorderPantryItems' ||
        action.type === 'items/reorderShoppingItems') {
      // Sync all items for bulk operations
      itemsAfter.forEach((item) => {
        syncService.pushItemChange(item).catch(console.error);
      });
    } else {
      // For single item operations, find and sync the affected item
      let itemId: string | undefined;

      if (action.payload?.itemId) {
        itemId = action.payload.itemId;
      } else if (action.payload?.name) {
        // For addItemToList, find by name (case-insensitive)
        const name = action.payload.name.toLowerCase();
        const item = itemsAfter.find((i) => i.name.toLowerCase() === name);
        itemId = item?.id;
      }

      if (itemId) {
        const item = itemsAfter.find((i) => i.id === itemId);
        if (item) {
          syncService.pushItemChange(item).catch(console.error);
        }
      }
    }
  }

  // Handle recipe sync actions
  if (recipeSyncActions.includes(action.type)) {
    const stateAfter = store.getState();
    const recipes: Recipe[] = stateAfter.recipes?.recipes || [];

    if (action.type === 'recipes/removeRecipe') {
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
