import firestore from '@react-native-firebase/firestore';
import { FirestoreSpace, FirestoreItem, FirestoreRecipe, FirestoreSpaceMember, AvailableSpace } from '@/types/firebase';
import { Item } from '@/store/slices/itemsSlice';
import { Recipe } from '@/store/slices/recipesSlice';

const spacesCollection = firestore().collection('spaces');

// Helper to recursively remove undefined values from an object
// Firestore doesn't accept undefined values
const removeUndefined = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefined(value);
      }
    }
    return cleaned;
  }
  return obj;
};

export const spaceService = {
  // Get a space by ID
  getSpace: async (spaceId: string): Promise<FirestoreSpace | null> => {
    const doc = await spacesCollection.doc(spaceId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as FirestoreSpace;
  },

  // Subscribe to a space
  subscribeToSpace: (
    spaceId: string,
    callback: (space: FirestoreSpace | null) => void
  ) => {
    return spacesCollection.doc(spaceId).onSnapshot((doc) => {
      if (doc.exists) {
        callback({ id: doc.id, ...doc.data() } as FirestoreSpace);
      } else {
        callback(null);
      }
    });
  },

  // Get all spaces the user is a member of
  getUserSpaces: async (userId: string): Promise<AvailableSpace[]> => {
    const snapshot = await spacesCollection
      .where('memberIds', 'array-contains', userId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ownerDisplayName: data.ownerDisplayName,
        ownerEmail: data.ownerEmail,
        isOwner: data.ownerId === userId,
        sharingPaused: data.sharingPaused || false,
      };
    });
  },

  // Subscribe to user's spaces list
  subscribeToUserSpaces: (
    userId: string,
    callback: (spaces: AvailableSpace[]) => void
  ) => {
    return spacesCollection
      .where('memberIds', 'array-contains', userId)
      .onSnapshot((snapshot) => {
        const spaces = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ownerDisplayName: data.ownerDisplayName,
            ownerEmail: data.ownerEmail,
            isOwner: data.ownerId === userId,
            sharingPaused: data.sharingPaused || false,
          };
        });
        callback(spaces);
      });
  },

  // Subscribe to items in a space
  subscribeToItems: (
    spaceId: string,
    callback: (items: Item[]) => void
  ) => {
    return spacesCollection
      .doc(spaceId)
      .collection('items')
      .onSnapshot((snapshot) => {
        // Skip updates that have pending writes - this prevents stale data
        // from overwriting optimistic local updates before Firebase acknowledges them
        if (snapshot.metadata.hasPendingWrites) {
          console.log('[SpaceService] Skipping items update - has pending writes');
          return;
        }

        const items = snapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreItem;
          return {
            id: doc.id,
            name: data.name,
            quantity: data.quantity,
            unit: data.unit,
            category: data.category,
            shoppingPreferences: data.shoppingPreferences,
            lists: data.lists,
          } as Item;
        });
        callback(items);
      });
  },

  // Subscribe to recipes in a space
  subscribeToRecipes: (
    spaceId: string,
    callback: (recipes: Recipe[]) => void
  ) => {
    return spacesCollection
      .doc(spaceId)
      .collection('recipes')
      .onSnapshot((snapshot) => {
        // Skip updates that have pending writes - this prevents stale data
        // from overwriting optimistic local updates before Firebase acknowledges them
        if (snapshot.metadata.hasPendingWrites) {
          console.log('[SpaceService] Skipping recipes update - has pending writes');
          return;
        }

        const recipes = snapshot.docs.map((doc) => {
          const data = doc.data() as FirestoreRecipe;
          return {
            id: doc.id,
            name: data.name,
            description: data.description,
            servings: data.servings,
            ingredients: data.ingredients,
            instructions: data.instructions,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          } as Recipe;
        });
        callback(recipes);
      });
  },

  // Subscribe to space members
  subscribeToMembers: (
    spaceId: string,
    callback: (members: FirestoreSpaceMember[]) => void
  ) => {
    return spacesCollection
      .doc(spaceId)
      .collection('members')
      .onSnapshot((snapshot) => {
        const members = snapshot.docs.map((doc) => doc.data() as FirestoreSpaceMember);
        callback(members);
      });
  },

  // Add or update an item
  setItem: async (spaceId: string, item: Item, userId: string) => {
    // Build itemData and recursively remove undefined values
    const itemData = removeUndefined({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      category: item.category,
      shoppingPreferences: item.shoppingPreferences,
      lists: item.lists,
      updatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    await spacesCollection
      .doc(spaceId)
      .collection('items')
      .doc(item.id)
      .set(itemData, { merge: true });
  },

  // Delete an item
  deleteItem: async (spaceId: string, itemId: string) => {
    await spacesCollection
      .doc(spaceId)
      .collection('items')
      .doc(itemId)
      .delete();
  },

  // Add or update a recipe
  setRecipe: async (spaceId: string, recipe: Recipe, userId: string) => {
    // Build recipeData and recursively remove undefined values
    const recipeData = removeUndefined({
      name: recipe.name,
      description: recipe.description,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      createdAt: recipe.createdAt,
      updatedAt: recipe.updatedAt,
      syncUpdatedAt: firestore.FieldValue.serverTimestamp(),
      updatedBy: userId,
    });

    await spacesCollection
      .doc(spaceId)
      .collection('recipes')
      .doc(recipe.id)
      .set(recipeData, { merge: true });
  },

  // Delete a recipe
  deleteRecipe: async (spaceId: string, recipeId: string) => {
    await spacesCollection
      .doc(spaceId)
      .collection('recipes')
      .doc(recipeId)
      .delete();
  },

  // Batch set items (for migration)
  batchSetItems: async (spaceId: string, items: Item[], userId: string) => {
    const batch = firestore().batch();
    const itemsRef = spacesCollection.doc(spaceId).collection('items');

    items.forEach((item) => {
      // Build itemData and recursively remove undefined values
      const itemData = removeUndefined({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category,
        shoppingPreferences: item.shoppingPreferences,
        lists: item.lists,
        updatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });

      batch.set(itemsRef.doc(item.id), itemData);
    });

    await batch.commit();
  },

  // Batch set recipes (for migration)
  batchSetRecipes: async (spaceId: string, recipes: Recipe[], userId: string) => {
    const batch = firestore().batch();
    const recipesRef = spacesCollection.doc(spaceId).collection('recipes');

    recipes.forEach((recipe) => {
      // Build recipeData and recursively remove undefined values
      const recipeData = removeUndefined({
        name: recipe.name,
        description: recipe.description,
        servings: recipe.servings,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        createdAt: recipe.createdAt,
        updatedAt: recipe.updatedAt,
        syncUpdatedAt: firestore.FieldValue.serverTimestamp(),
        updatedBy: userId,
      });
      batch.set(recipesRef.doc(recipe.id), recipeData);
    });

    await batch.commit();
  },

  // Check if space has any items
  hasItems: async (spaceId: string): Promise<boolean> => {
    const snapshot = await spacesCollection
      .doc(spaceId)
      .collection('items')
      .limit(1)
      .get();
    return !snapshot.empty;
  },

  // Check if space has any recipes
  hasRecipes: async (spaceId: string): Promise<boolean> => {
    const snapshot = await spacesCollection
      .doc(spaceId)
      .collection('recipes')
      .limit(1)
      .get();
    return !snapshot.empty;
  },

  // Remove a member from a space
  removeMember: async (spaceId: string, userId: string) => {
    const spaceRef = spacesCollection.doc(spaceId);

    await spaceRef.update({
      memberIds: firestore.FieldValue.arrayRemove(userId),
    });

    await spaceRef.collection('members').doc(userId).delete();
  },

  // Pause sharing (owner disables sync, members become read-only)
  pauseSharing: async (spaceId: string) => {
    await spacesCollection.doc(spaceId).update({
      sharingPaused: true,
    });
  },

  // Resume sharing (owner re-enables sync)
  resumeSharing: async (spaceId: string) => {
    await spacesCollection.doc(spaceId).update({
      sharingPaused: false,
    });
  },

  // Clear all items in a space (used before re-uploading local data)
  clearAllItems: async (spaceId: string) => {
    const itemsSnapshot = await spacesCollection
      .doc(spaceId)
      .collection('items')
      .get();

    const batch = firestore().batch();
    itemsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  },

  // Clear all recipes in a space (used before re-uploading local data)
  clearAllRecipes: async (spaceId: string) => {
    const recipesSnapshot = await spacesCollection
      .doc(spaceId)
      .collection('recipes')
      .get();

    const batch = firestore().batch();
    recipesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  },
};
