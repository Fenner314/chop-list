import { store } from '@/store';
import { spaceService } from './spaceService';
import { setItems, Item } from '@/store/slices/itemsSlice';
import { Recipe } from '@/store/slices/recipesSlice';

type Unsubscribe = () => void;

interface SyncState {
  currentSpaceId: string | null;
  userId: string | null;
  itemsUnsubscribe: Unsubscribe | null;
  recipesUnsubscribe: Unsubscribe | null;
  spacesUnsubscribe: Unsubscribe | null;
  isInitialized: boolean;
}

const syncState: SyncState = {
  currentSpaceId: null,
  userId: null,
  itemsUnsubscribe: null,
  recipesUnsubscribe: null,
  spacesUnsubscribe: null,
  isInitialized: false,
};

// Callbacks for Redux updates
let onItemsUpdate: ((items: Item[]) => void) | null = null;
let onRecipesUpdate: ((recipes: Recipe[]) => void) | null = null;
let onSpacesUpdate: ((spaces: any[]) => void) | null = null;

export const syncService = {
  // Initialize sync with callbacks
  initialize: (callbacks: {
    onItemsUpdate: (items: Item[]) => void;
    onRecipesUpdate: (recipes: Recipe[]) => void;
    onSpacesUpdate: (spaces: any[]) => void;
  }) => {
    onItemsUpdate = callbacks.onItemsUpdate;
    onRecipesUpdate = callbacks.onRecipesUpdate;
    onSpacesUpdate = callbacks.onSpacesUpdate;
    syncState.isInitialized = true;
  },

  // Set the current user
  setUser: (userId: string | null) => {
    console.log('[SyncService] setUser called with userId:', userId);
    if (syncState.userId !== userId) {
      // User changed, stop existing sync
      syncService.stopSync();
      syncState.userId = userId;
      console.log('[SyncService] userId set to:', syncState.userId);

      // Start subscribing to user's spaces
      if (userId && onSpacesUpdate) {
        syncState.spacesUnsubscribe = spaceService.subscribeToUserSpaces(
          userId,
          onSpacesUpdate
        );
      }
    }
  },

  // Start syncing a specific space
  startSync: (spaceId: string) => {
    console.log('[SyncService] startSync called with spaceId:', spaceId);
    if (!syncState.isInitialized) {
      console.warn('SyncService not initialized');
      return;
    }

    // Stop existing item/recipe sync if switching spaces
    if (syncState.itemsUnsubscribe) {
      syncState.itemsUnsubscribe();
      syncState.itemsUnsubscribe = null;
    }
    if (syncState.recipesUnsubscribe) {
      syncState.recipesUnsubscribe();
      syncState.recipesUnsubscribe = null;
    }

    syncState.currentSpaceId = spaceId;
    console.log('[SyncService] currentSpaceId set to:', syncState.currentSpaceId);

    // Subscribe to items
    if (onItemsUpdate) {
      syncState.itemsUnsubscribe = spaceService.subscribeToItems(
        spaceId,
        onItemsUpdate
      );
    }

    // Subscribe to recipes
    if (onRecipesUpdate) {
      syncState.recipesUnsubscribe = spaceService.subscribeToRecipes(
        spaceId,
        onRecipesUpdate
      );
    }
  },

  // Stop all syncing
  stopSync: () => {
    if (syncState.itemsUnsubscribe) {
      syncState.itemsUnsubscribe();
      syncState.itemsUnsubscribe = null;
    }
    if (syncState.recipesUnsubscribe) {
      syncState.recipesUnsubscribe();
      syncState.recipesUnsubscribe = null;
    }
    if (syncState.spacesUnsubscribe) {
      syncState.spacesUnsubscribe();
      syncState.spacesUnsubscribe = null;
    }
    syncState.currentSpaceId = null;
  },

  // Push an item change to Firebase
  pushItemChange: async (item: Item) => {
    console.log('[SyncService] pushItemChange called', {
      itemName: item.name,
      currentSpaceId: syncState.currentSpaceId,
      userId: syncState.userId,
    });
    if (!syncState.currentSpaceId || !syncState.userId) {
      console.warn('[SyncService] Cannot push item - missing spaceId or userId');
      return;
    }
    await spaceService.setItem(syncState.currentSpaceId, item, syncState.userId);
    console.log('[SyncService] Item pushed to Firebase:', item.name);
  },

  // Push an item deletion to Firebase
  pushItemDelete: async (itemId: string) => {
    if (!syncState.currentSpaceId) return;
    await spaceService.deleteItem(syncState.currentSpaceId, itemId);
  },

  // Push a recipe change to Firebase
  pushRecipeChange: async (recipe: Recipe) => {
    if (!syncState.currentSpaceId || !syncState.userId) return;
    await spaceService.setRecipe(syncState.currentSpaceId, recipe, syncState.userId);
  },

  // Push a recipe deletion to Firebase
  pushRecipeDelete: async (recipeId: string) => {
    if (!syncState.currentSpaceId) return;
    await spaceService.deleteRecipe(syncState.currentSpaceId, recipeId);
  },

  // Get current space ID
  getCurrentSpaceId: () => syncState.currentSpaceId,

  // Get current user ID
  getUserId: () => syncState.userId,

  // Check if syncing is active
  isSyncing: () => syncState.currentSpaceId !== null,

  // Check if user is logged in
  isLoggedIn: () => syncState.userId !== null,
};
