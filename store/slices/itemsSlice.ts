import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { autoCategorizeItem } from '@/utils/categorization';

// List-specific metadata for each list an item belongs to
export interface PantryMetadata {
  expirationDate?: number;
  addedDate: number;
  order: number;
}

export interface ShoppingMetadata {
  completed: boolean;
  createdAt: number;
  order: number;
}

// Centralized Item that can exist in multiple lists
export interface Item {
  id: string; // Global unique ID
  name: string;
  quantity: string; // Numeric quantity as string
  unit?: string; // Unit of measurement (e.g., "cup", "tbsp", "g", "oz")
  category: string;

  // List membership - an item can be in pantry, shopping, both, or neither
  lists: {
    pantry?: PantryMetadata;
    shopping?: ShoppingMetadata;
  };
}

interface ItemsState {
  items: Item[];
}

const initialState: ItemsState = {
  items: [],
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    // Add item to a specific list
    addItemToList: (
      state,
      action: PayloadAction<{
        listType: 'pantry' | 'shopping';
        name: string;
        quantity: string;
        unit?: string;
        category?: string;
        expirationDate?: number;
      }>
    ) => {
      const { listType, name, quantity, unit, category, expirationDate } = action.payload;

      // Check if item already exists (case-insensitive name match)
      const existingItem = state.items.find(
        item => item.name.toLowerCase() === name.toLowerCase()
      );

      if (existingItem) {
        // Item exists, add it to the new list
        if (listType === 'pantry') {
          const pantryItemsCount = state.items.filter(i => i.lists.pantry).length;
          existingItem.lists.pantry = {
            expirationDate,
            addedDate: Date.now(),
            order: pantryItemsCount,
          };
        } else {
          const shoppingItemsCount = state.items.filter(i => i.lists.shopping).length;
          existingItem.lists.shopping = {
            completed: false,
            createdAt: Date.now(),
            order: shoppingItemsCount,
          };
        }

        // Update category, quantity, and unit if provided
        if (category) {
          existingItem.category = category;
        }
        existingItem.quantity = quantity;
        existingItem.unit = unit;
      } else {
        // Create new item
        const autoCategory = category || autoCategorizeItem(name);
        const newItem: Item = {
          id: `${Date.now()}-${Math.random()}`,
          name: name.trim(),
          quantity: quantity || '1',
          unit: unit,
          category: autoCategory,
          lists: {},
        };

        if (listType === 'pantry') {
          const pantryItemsCount = state.items.filter(i => i.lists.pantry).length;
          newItem.lists.pantry = {
            expirationDate,
            addedDate: Date.now(),
            order: pantryItemsCount,
          };
        } else {
          const shoppingItemsCount = state.items.filter(i => i.lists.shopping).length;
          newItem.lists.shopping = {
            completed: false,
            createdAt: Date.now(),
            order: shoppingItemsCount,
          };
        }

        state.items.push(newItem);
      }
    },

    // Remove item from a specific list
    removeItemFromList: (
      state,
      action: PayloadAction<{ itemId: string; listType: 'pantry' | 'shopping' }>
    ) => {
      const { itemId, listType } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item) {
        delete item.lists[listType];

        // If item is no longer in any list, remove it completely
        if (!item.lists.pantry && !item.lists.shopping) {
          state.items = state.items.filter(i => i.id !== itemId);
        }
      }
    },

    // Update item core properties (affects all lists it's in)
    updateItem: (
      state,
      action: PayloadAction<{
        itemId: string;
        name?: string;
        quantity?: string;
        unit?: string;
        category?: string;
      }>
    ) => {
      const { itemId, name, quantity, unit, category } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item) {
        if (name !== undefined) item.name = name;
        if (quantity !== undefined) item.quantity = quantity;
        if (unit !== undefined) item.unit = unit;
        if (category !== undefined) item.category = category;
      }
    },

    // Update list-specific metadata for pantry
    updatePantryMetadata: (
      state,
      action: PayloadAction<{
        itemId: string;
        metadata: Partial<PantryMetadata>;
      }>
    ) => {
      const { itemId, metadata } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item && item.lists.pantry) {
        Object.assign(item.lists.pantry, metadata);
      }
    },

    // Update list-specific metadata for shopping
    updateShoppingMetadata: (
      state,
      action: PayloadAction<{
        itemId: string;
        metadata: Partial<ShoppingMetadata>;
      }>
    ) => {
      const { itemId, metadata } = action.payload;
      const item = state.items.find(i => i.id === itemId);

      if (item && item.lists.shopping) {
        Object.assign(item.lists.shopping, metadata);
      }
    },

    // Toggle shopping item completion
    toggleShoppingCompleted: (state, action: PayloadAction<string>) => {
      const item = state.items.find(i => i.id === action.payload);
      if (item && item.lists.shopping) {
        item.lists.shopping.completed = !item.lists.shopping.completed;
      }
    },

    // Update item category
    updateItemCategory: (
      state,
      action: PayloadAction<{ itemId: string; category: string }>
    ) => {
      const item = state.items.find(i => i.id === action.payload.itemId);
      if (item) {
        item.category = action.payload.category;
      }
    },

    // Reorder items in pantry
    reorderPantryItems: (state, action: PayloadAction<Item[]>) => {
      action.payload.forEach((item, index) => {
        const stateItem = state.items.find(i => i.id === item.id);
        if (stateItem && stateItem.lists.pantry) {
          stateItem.lists.pantry.order = index;
          // Also update the item properties
          stateItem.name = item.name;
          stateItem.quantity = item.quantity;
          stateItem.category = item.category;
          if (item.lists.pantry) {
            stateItem.lists.pantry.expirationDate = item.lists.pantry.expirationDate;
          }
        }
      });
    },

    // Reorder items in shopping
    reorderShoppingItems: (state, action: PayloadAction<Item[]>) => {
      action.payload.forEach((item, index) => {
        const stateItem = state.items.find(i => i.id === item.id);
        if (stateItem && stateItem.lists.shopping) {
          stateItem.lists.shopping.order = index;
          // Also update the item properties
          stateItem.name = item.name;
          stateItem.quantity = item.quantity;
          stateItem.category = item.category;
        }
      });
    },

    // Clear completed shopping items
    clearCompletedShopping: (state) => {
      const itemsToProcess = [...state.items];
      itemsToProcess.forEach(item => {
        if (item.lists.shopping?.completed) {
          const stateItem = state.items.find(i => i.id === item.id);
          if (stateItem) {
            delete stateItem.lists.shopping;

            // Remove item completely if not in any other list
            if (!stateItem.lists.pantry) {
              state.items = state.items.filter(i => i.id !== item.id);
            }
          }
        }
      });
    },

    // Uncheck all shopping items
    uncheckAllShopping: (state) => {
      state.items.forEach(item => {
        if (item.lists.shopping) {
          item.lists.shopping.completed = false;
        }
      });
    },

    // Clear expired pantry items
    clearExpiredPantry: (state) => {
      const now = Date.now();
      const itemsToProcess = [...state.items];
      itemsToProcess.forEach(item => {
        if (item.lists.pantry?.expirationDate && item.lists.pantry.expirationDate <= now) {
          const stateItem = state.items.find(i => i.id === item.id);
          if (stateItem) {
            delete stateItem.lists.pantry;

            // Remove item completely if not in any other list
            if (!stateItem.lists.shopping) {
              state.items = state.items.filter(i => i.id !== item.id);
            }
          }
        }
      });
    },

    // Clear all items from a list
    clearAllFromList: (state, action: PayloadAction<'pantry' | 'shopping'>) => {
      const listType = action.payload;
      const itemsToProcess = [...state.items];

      itemsToProcess.forEach(item => {
        const stateItem = state.items.find(i => i.id === item.id);
        if (stateItem) {
          delete stateItem.lists[listType];

          // Remove item completely if not in any other list
          if (!stateItem.lists.pantry && !stateItem.lists.shopping) {
            state.items = state.items.filter(i => i.id !== item.id);
          }
        }
      });
    },

    // Clear all items completely
    clearAllItems: (state) => {
      state.items = [];
    },

    // Subtract recipe ingredients from pantry quantities
    subtractRecipeFromPantry: (
      state,
      action: PayloadAction<{ ingredients: Array<{ name: string; quantity: string }> }>
    ) => {
      const { ingredients } = action.payload;

      ingredients.forEach((ingredient) => {
        // Find matching pantry item (case-insensitive)
        const pantryItem = state.items.find(
          (item) =>
            item.lists.pantry &&
            item.name.toLowerCase() === ingredient.name.toLowerCase()
        );

        if (pantryItem && pantryItem.lists.pantry) {
          // Parse quantities
          const currentQty = parseFloat(pantryItem.quantity) || 0;
          const subtractQty = parseFloat(ingredient.quantity) || 0;

          // Subtract quantity
          const newQty = currentQty - subtractQty;

          if (newQty <= 0) {
            // Remove from pantry if quantity reaches 0 or below
            delete pantryItem.lists.pantry;

            // Remove item completely if not in any other list
            if (!pantryItem.lists.shopping) {
              state.items = state.items.filter((i) => i.id !== pantryItem.id);
            }
          } else {
            // Update quantity
            pantryItem.quantity = newQty.toString();
          }
        }
      });
    },
  },
});

export const {
  addItemToList,
  removeItemFromList,
  updateItem,
  updatePantryMetadata,
  updateShoppingMetadata,
  toggleShoppingCompleted,
  updateItemCategory,
  reorderPantryItems,
  reorderShoppingItems,
  clearCompletedShopping,
  uncheckAllShopping,
  clearExpiredPantry,
  clearAllFromList,
  clearAllItems,
  subtractRecipeFromPantry,
} = itemsSlice.actions;

export default itemsSlice.reducer;
