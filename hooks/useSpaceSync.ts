import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { syncService } from '@/services/syncService';
import { spaceService } from '@/services/spaceService';
import { setAllItems, Item } from '@/store/slices/itemsSlice';
import { setAllRecipes, Recipe } from '@/store/slices/recipesSlice';
import {
  setCurrentSpaceId,
  setAvailableSpaces,
  setSyncStatus,
} from '@/store/slices/settingsSlice';
import { AvailableSpace } from '@/types/firebase';

export function useSpaceSync() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAuth();
  const currentSpaceId = useAppSelector((state) => state.settings.currentSpaceId);
  const availableSpaces = useAppSelector((state) => state.settings.availableSpaces);
  const localItems = useAppSelector((state) => state.items.items);
  const localRecipes = useAppSelector((state) => state.recipes.recipes);

  const isInitializedRef = useRef(false);
  const isSyncingFromFirebase = useRef(false);

  // Initialize sync service
  useEffect(() => {
    if (isInitializedRef.current) return;

    syncService.initialize({
      onItemsUpdate: (items: Item[]) => {
        isSyncingFromFirebase.current = true;
        dispatch(setAllItems(items));
        dispatch(setSyncStatus('synced'));
        // Reset flag after a short delay to allow Redux to process
        setTimeout(() => {
          isSyncingFromFirebase.current = false;
        }, 100);
      },
      onRecipesUpdate: (recipes: Recipe[]) => {
        isSyncingFromFirebase.current = true;
        dispatch(setAllRecipes(recipes));
        // Reset flag after a short delay
        setTimeout(() => {
          isSyncingFromFirebase.current = false;
        }, 100);
      },
      onSpacesUpdate: (spaces: AvailableSpace[]) => {
        dispatch(setAvailableSpaces(spaces));
      },
    });

    isInitializedRef.current = true;
  }, [dispatch]);

  // Handle user auth state changes
  useEffect(() => {
    if (isAuthenticated && user) {
      syncService.setUser(user.uid);

      // If no current space is set, default to user's own space
      if (!currentSpaceId) {
        dispatch(setCurrentSpaceId(user.uid));
      }
    } else {
      syncService.setUser(null);
      // Clear space when logged out
      if (currentSpaceId) {
        dispatch(setCurrentSpaceId(null));
      }
    }
  }, [isAuthenticated, user, currentSpaceId, dispatch]);

  // Start/stop sync when space changes
  useEffect(() => {
    if (currentSpaceId && isAuthenticated) {
      dispatch(setSyncStatus('syncing'));
      syncService.startSync(currentSpaceId);
    } else {
      syncService.stopSync();
      dispatch(setSyncStatus('local'));
    }

    return () => {
      // Cleanup handled by stopSync
    };
  }, [currentSpaceId, isAuthenticated, dispatch]);

  // Switch to a different space
  const switchSpace = useCallback(
    (spaceId: string) => {
      if (spaceId !== currentSpaceId) {
        dispatch(setCurrentSpaceId(spaceId));
      }
    },
    [currentSpaceId, dispatch]
  );

  // Push local item change to Firebase
  const syncItem = useCallback(
    async (item: Item) => {
      if (!currentSpaceId || !isAuthenticated || isSyncingFromFirebase.current) return;
      try {
        await syncService.pushItemChange(item);
      } catch (error) {
        console.error('Failed to sync item:', error);
      }
    },
    [currentSpaceId, isAuthenticated]
  );

  // Push local item deletion to Firebase
  const syncItemDelete = useCallback(
    async (itemId: string) => {
      if (!currentSpaceId || !isAuthenticated || isSyncingFromFirebase.current) return;
      try {
        await syncService.pushItemDelete(itemId);
      } catch (error) {
        console.error('Failed to sync item deletion:', error);
      }
    },
    [currentSpaceId, isAuthenticated]
  );

  // Push local recipe change to Firebase
  const syncRecipe = useCallback(
    async (recipe: Recipe) => {
      if (!currentSpaceId || !isAuthenticated || isSyncingFromFirebase.current) return;
      try {
        await syncService.pushRecipeChange(recipe);
      } catch (error) {
        console.error('Failed to sync recipe:', error);
      }
    },
    [currentSpaceId, isAuthenticated]
  );

  // Push local recipe deletion to Firebase
  const syncRecipeDelete = useCallback(
    async (recipeId: string) => {
      if (!currentSpaceId || !isAuthenticated || isSyncingFromFirebase.current) return;
      try {
        await syncService.pushRecipeDelete(recipeId);
      } catch (error) {
        console.error('Failed to sync recipe deletion:', error);
      }
    },
    [currentSpaceId, isAuthenticated]
  );

  // Migrate local data to Firebase space
  const migrateLocalData = useCallback(async () => {
    if (!currentSpaceId || !user) return false;

    try {
      // Check if space already has data
      const hasItems = await spaceService.hasItems(currentSpaceId);
      const hasRecipes = await spaceService.hasRecipes(currentSpaceId);

      if (hasItems || hasRecipes) {
        // Space already has data, don't overwrite
        return false;
      }

      // Migrate items
      if (localItems.length > 0) {
        await spaceService.batchSetItems(currentSpaceId, localItems, user.uid);
      }

      // Migrate recipes
      if (localRecipes.length > 0) {
        await spaceService.batchSetRecipes(currentSpaceId, localRecipes, user.uid);
      }

      return true;
    } catch (error) {
      console.error('Failed to migrate data:', error);
      return false;
    }
  }, [currentSpaceId, user, localItems, localRecipes]);

  // Get current space info
  const getCurrentSpaceInfo = useCallback(() => {
    if (!currentSpaceId) return null;
    return availableSpaces.find((s) => s.id === currentSpaceId) || null;
  }, [currentSpaceId, availableSpaces]);

  // Check if viewing own space
  const isOwnSpace = useCallback(() => {
    if (!user || !currentSpaceId) return true; // Default to true if not logged in
    return currentSpaceId === user.uid;
  }, [user, currentSpaceId]);

  return {
    // State
    currentSpaceId,
    availableSpaces,
    isAuthenticated,
    isSyncing: !!currentSpaceId && isAuthenticated,

    // Actions
    switchSpace,
    syncItem,
    syncItemDelete,
    syncRecipe,
    syncRecipeDelete,
    migrateLocalData,

    // Helpers
    getCurrentSpaceInfo,
    isOwnSpace,
  };
}
