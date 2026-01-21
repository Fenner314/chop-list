import { store } from '@/store';
import { spaceService } from '@/services/spaceService';
import { authService } from '@/services/authService';

export interface MigrationResult {
  success: boolean;
  itemsMigrated: number;
  recipesMigrated: number;
  error?: string;
}

export interface PushResult {
  success: boolean;
  itemsPushed: number;
  recipesPushed: number;
  error?: string;
}

/**
 * Migrates local Redux data to the user's Firebase space.
 * Only migrates if the Firebase space is empty.
 */
export async function migrateLocalDataToFirebase(): Promise<MigrationResult> {
  const user = authService.getCurrentUser();

  if (!user) {
    return {
      success: false,
      itemsMigrated: 0,
      recipesMigrated: 0,
      error: 'User not authenticated',
    };
  }

  const spaceId = user.uid;
  const state = store.getState();
  const localItems = state.items.items;
  const localRecipes = state.recipes.recipes;

  // Check if there's anything to migrate
  if (localItems.length === 0 && localRecipes.length === 0) {
    return {
      success: true,
      itemsMigrated: 0,
      recipesMigrated: 0,
    };
  }

  try {
    // Check if space already has data
    const hasItems = await spaceService.hasItems(spaceId);
    const hasRecipes = await spaceService.hasRecipes(spaceId);

    if (hasItems || hasRecipes) {
      // Space already has data, don't overwrite
      return {
        success: true,
        itemsMigrated: 0,
        recipesMigrated: 0,
      };
    }

    let itemsMigrated = 0;
    let recipesMigrated = 0;

    // Migrate items in batches
    if (localItems.length > 0) {
      await spaceService.batchSetItems(spaceId, localItems, user.uid);
      itemsMigrated = localItems.length;
    }

    // Migrate recipes in batches
    if (localRecipes.length > 0) {
      await spaceService.batchSetRecipes(spaceId, localRecipes, user.uid);
      recipesMigrated = localRecipes.length;
    }

    return {
      success: true,
      itemsMigrated,
      recipesMigrated,
    };
  } catch (error: any) {
    console.error('Migration failed:', error);
    return {
      success: false,
      itemsMigrated: 0,
      recipesMigrated: 0,
      error: error.message || 'Migration failed',
    };
  }
}

/**
 * Checks if migration is needed (user is authenticated and has local data but Firebase is empty)
 */
export async function shouldMigrateData(): Promise<boolean> {
  const user = authService.getCurrentUser();

  if (!user) {
    return false;
  }

  const spaceId = user.uid;
  const state = store.getState();
  const localItems = state.items.items;
  const localRecipes = state.recipes.recipes;

  // No local data to migrate
  if (localItems.length === 0 && localRecipes.length === 0) {
    return false;
  }

  try {
    // Check if Firebase already has data
    const hasItems = await spaceService.hasItems(spaceId);
    const hasRecipes = await spaceService.hasRecipes(spaceId);

    // Only migrate if Firebase is empty
    return !hasItems && !hasRecipes;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

/**
 * Pushes local Redux data to Firebase, REPLACING any existing cloud data.
 * Used when re-enabling sharing - local data takes precedence.
 */
export async function pushLocalDataToFirebase(): Promise<PushResult> {
  const user = authService.getCurrentUser();

  if (!user) {
    return {
      success: false,
      itemsPushed: 0,
      recipesPushed: 0,
      error: 'User not authenticated',
    };
  }

  const spaceId = user.uid;
  const state = store.getState();
  const localItems = state.items.items;
  const localRecipes = state.recipes.recipes;

  try {
    // Clear existing items and recipes in Firebase
    await spaceService.clearAllItems(spaceId);
    await spaceService.clearAllRecipes(spaceId);

    let itemsPushed = 0;
    let recipesPushed = 0;

    // Push local items to Firebase
    if (localItems.length > 0) {
      await spaceService.batchSetItems(spaceId, localItems, user.uid);
      itemsPushed = localItems.length;
    }

    // Push local recipes to Firebase
    if (localRecipes.length > 0) {
      await spaceService.batchSetRecipes(spaceId, localRecipes, user.uid);
      recipesPushed = localRecipes.length;
    }

    return {
      success: true,
      itemsPushed,
      recipesPushed,
    };
  } catch (error: any) {
    console.error('Push to Firebase failed:', error);
    return {
      success: false,
      itemsPushed: 0,
      recipesPushed: 0,
      error: error.message || 'Push failed',
    };
  }
}
