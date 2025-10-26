import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Centralized item that exists across lists
export interface Item {
  id: string;
  name: string;
  category: string;
  createdAt: number;
}

// List membership tracking
export interface ItemListMembership {
  itemId: string;
  inPantry: boolean;
  inShopping: boolean;
  inRecipes: boolean;

  // List-specific properties
  pantryQuantity?: string;
  pantryExpirationDate?: number;
  pantryOrder?: number;

  shoppingQuantity?: string;
  shoppingCompleted?: boolean;
  shoppingOrder?: number;
}

interface ItemsState {
  // All items by ID
  items: Record<string, Item>;
  // List membership and list-specific data
  membership: Record<string, ItemListMembership>;
}

const initialState: ItemsState = {
  items: {},
  membership: {},
};

const itemsSlice = createSlice({
  name: 'items',
  initialState,
  reducers: {
    // Create or get item ID for a name
    ensureItem: (state, action: PayloadAction<{ name: string; category: string }>) => {
      // Check if item with this name already exists (case-insensitive)
      const existingItem = Object.values(state.items).find(
        item => item.name.toLowerCase() === action.payload.name.toLowerCase()
      );

      if (!existingItem) {
        // Create new item
        const id = `item-${Date.now()}-${Math.random()}`;
        state.items[id] = {
          id,
          name: action.payload.name,
          category: action.payload.category,
          createdAt: Date.now(),
        };
        state.membership[id] = {
          itemId: id,
          inPantry: false,
          inShopping: false,
          inRecipes: false,
        };
      }
    },

    // Update item core properties (syncs across all lists)
    updateItem: (state, action: PayloadAction<{ id: string; name?: string; category?: string }>) => {
      const item = state.items[action.payload.id];
      if (item) {
        if (action.payload.name !== undefined) item.name = action.payload.name;
        if (action.payload.category !== undefined) item.category = action.payload.category;
      }
    },

    // Add to pantry
    addToPantry: (state, action: PayloadAction<{
      name: string;
      category: string;
      quantity: string;
      expirationDate?: number;
    }>) => {
      // Find or create item
      let itemId = Object.values(state.items).find(
        item => item.name.toLowerCase() === action.payload.name.toLowerCase()
      )?.id;

      if (!itemId) {
        itemId = `item-${Date.now()}-${Math.random()}`;
        state.items[itemId] = {
          id: itemId,
          name: action.payload.name,
          category: action.payload.category,
          createdAt: Date.now(),
        };
      }

      if (!state.membership[itemId]) {
        state.membership[itemId] = {
          itemId,
          inPantry: false,
          inShopping: false,
          inRecipes: false,
        };
      }

      state.membership[itemId].inPantry = true;
      state.membership[itemId].pantryQuantity = action.payload.quantity;
      state.membership[itemId].pantryExpirationDate = action.payload.expirationDate;

      // Update item category
      state.items[itemId].category = action.payload.category;
    },

    // Add to shopping
    addToShopping: (state, action: PayloadAction<{
      name: string;
      category: string;
      quantity: string;
    }>) => {
      // Find or create item
      let itemId = Object.values(state.items).find(
        item => item.name.toLowerCase() === action.payload.name.toLowerCase()
      )?.id;

      if (!itemId) {
        itemId = `item-${Date.now()}-${Math.random()}`;
        state.items[itemId] = {
          id: itemId,
          name: action.payload.name,
          category: action.payload.category,
          createdAt: Date.now(),
        };
      }

      if (!state.membership[itemId]) {
        state.membership[itemId] = {
          itemId,
          inPantry: false,
          inShopping: false,
          inRecipes: false,
        };
      }

      // Only add if not already in shopping
      if (!state.membership[itemId].inShopping) {
        state.membership[itemId].inShopping = true;
        state.membership[itemId].shoppingQuantity = action.payload.quantity;
        state.membership[itemId].shoppingCompleted = false;

        // Update item category
        state.items[itemId].category = action.payload.category;
      }
    },

    // Remove from pantry
    removeFromPantry: (state, action: PayloadAction<string>) => {
      const membership = state.membership[action.payload];
      if (membership) {
        membership.inPantry = false;
        membership.pantryQuantity = undefined;
        membership.pantryExpirationDate = undefined;
        membership.pantryOrder = undefined;

        // Clean up if not in any list
        if (!membership.inShopping && !membership.inRecipes) {
          delete state.membership[action.payload];
          delete state.items[action.payload];
        }
      }
    },

    // Remove from shopping
    removeFromShopping: (state, action: PayloadAction<string>) => {
      const membership = state.membership[action.payload];
      if (membership) {
        membership.inShopping = false;
        membership.shoppingQuantity = undefined;
        membership.shoppingCompleted = undefined;
        membership.shoppingOrder = undefined;

        // Clean up if not in any list
        if (!membership.inPantry && !membership.inRecipes) {
          delete state.membership[action.payload];
          delete state.items[action.payload];
        }
      }
    },

    // Update pantry properties
    updatePantryProperties: (state, action: PayloadAction<{
      id: string;
      quantity?: string;
      expirationDate?: number;
      order?: number;
      category?: string;
    }>) => {
      const membership = state.membership[action.payload.id];
      const item = state.items[action.payload.id];

      if (membership && membership.inPantry) {
        if (action.payload.quantity !== undefined) membership.pantryQuantity = action.payload.quantity;
        if (action.payload.expirationDate !== undefined) membership.pantryExpirationDate = action.payload.expirationDate;
        if (action.payload.order !== undefined) membership.pantryOrder = action.payload.order;
      }

      if (item && action.payload.category !== undefined) {
        item.category = action.payload.category;
      }
    },

    // Update shopping properties
    updateShoppingProperties: (state, action: PayloadAction<{
      id: string;
      quantity?: string;
      completed?: boolean;
      order?: number;
      category?: string;
    }>) => {
      const membership = state.membership[action.payload.id];
      const item = state.items[action.payload.id];

      if (membership && membership.inShopping) {
        if (action.payload.quantity !== undefined) membership.shoppingQuantity = action.payload.quantity;
        if (action.payload.completed !== undefined) membership.shoppingCompleted = action.payload.completed;
        if (action.payload.order !== undefined) membership.shoppingOrder = action.payload.order;
      }

      if (item && action.payload.category !== undefined) {
        item.category = action.payload.category;
      }
    },

    // Toggle shopping completed
    toggleShoppingCompleted: (state, action: PayloadAction<string>) => {
      const membership = state.membership[action.payload];
      if (membership && membership.inShopping) {
        membership.shoppingCompleted = !membership.shoppingCompleted;
      }
    },

    // Uncheck all shopping
    uncheckAllShopping: (state) => {
      Object.values(state.membership).forEach(membership => {
        if (membership.inShopping) {
          membership.shoppingCompleted = false;
        }
      });
    },

    // Clear completed shopping
    clearCompletedShopping: (state) => {
      Object.keys(state.membership).forEach(id => {
        const membership = state.membership[id];
        if (membership.inShopping && membership.shoppingCompleted) {
          membership.inShopping = false;
          membership.shoppingQuantity = undefined;
          membership.shoppingCompleted = undefined;
          membership.shoppingOrder = undefined;

          // Clean up if not in any list
          if (!membership.inPantry && !membership.inRecipes) {
            delete state.membership[id];
            delete state.items[id];
          }
        }
      });
    },

    // Bulk reorder for pantry
    reorderPantryItems: (state, action: PayloadAction<Array<{ id: string; order: number; category: string }>>) => {
      action.payload.forEach(({ id, order, category }) => {
        const membership = state.membership[id];
        const item = state.items[id];
        if (membership && membership.inPantry) {
          membership.pantryOrder = order;
        }
        if (item) {
          item.category = category;
        }
      });
    },

    // Bulk reorder for shopping
    reorderShoppingItems: (state, action: PayloadAction<Array<{ id: string; order: number; category: string }>>) => {
      action.payload.forEach(({ id, order, category }) => {
        const membership = state.membership[id];
        const item = state.items[id];
        if (membership && membership.inShopping) {
          membership.shoppingOrder = order;
        }
        if (item) {
          item.category = category;
        }
      });
    },
  },
});

export const {
  ensureItem,
  updateItem,
  addToPantry,
  addToShopping,
  removeFromPantry,
  removeFromShopping,
  updatePantryProperties,
  updateShoppingProperties,
  toggleShoppingCompleted,
  uncheckAllShopping,
  clearCompletedShopping,
  reorderPantryItems,
  reorderShoppingItems,
} = itemsSlice.actions;

export default itemsSlice.reducer;
