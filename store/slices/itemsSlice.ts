import { autoCategorizeItem } from "@/utils/categorization";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// List-specific metadata for each list an item belongs to
export interface PantryMetadata {
  expirationDate?: number;
  addedDate: number;
  order: number;
  quantity?: string; // List-specific quantity (optional, falls back to item.quantity)
  unit?: string; // List-specific unit (optional, falls back to item.unit)
}

export interface ShoppingMetadata {
  completed: boolean;
  createdAt: number;
  order: number;
  quantity?: string; // List-specific quantity (optional, falls back to item.quantity)
  unit?: string; // List-specific unit (optional, falls back to item.unit)
}

// Centralized Item that can exist in multiple lists
export interface Item {
  id: string; // Global unique ID
  name: string;
  quantity: string; // Numeric quantity as string
  unit?: string; // Unit of measurement (e.g., "cup", "tbsp", "g", "oz")
  category: string;

  // Shopping preferences - remembers custom quantity/unit for shopping list
  shoppingPreferences?: {
    quantity: string;
    unit?: string;
  };

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
  name: "items",
  initialState,
  reducers: {
    // Add item to a specific list
    addItemToList: (
      state,
      action: PayloadAction<{
        listType: "pantry" | "shopping";
        name: string;
        quantity: string;
        unit?: string;
        category?: string;
        expirationDate?: number;
      }>
    ) => {
      const { listType, name, quantity, unit, category, expirationDate } =
        action.payload;

      // Check if item already exists (case-insensitive name match)
      const existingItem = state.items.find(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );

      if (existingItem) {
        // Item exists, add it to the new list
        if (listType === "pantry") {
          const pantryItemsCount = state.items.filter(
            (i) => i.lists.pantry
          ).length;
          existingItem.lists.pantry = {
            expirationDate,
            addedDate: Date.now(),
            order: pantryItemsCount,
            quantity,
            unit,
          };
        } else {
          // Adding to shopping list
          const shoppingItemsCount = state.items.filter(
            (i) => i.lists.shopping
          ).length;

          // Use saved shopping preferences if they exist, otherwise use provided values
          let shoppingQuantity = quantity;
          let shoppingUnit = unit;

          if (existingItem.shoppingPreferences) {
            shoppingQuantity = existingItem.shoppingPreferences.quantity;
            shoppingUnit = existingItem.shoppingPreferences.unit;
          }

          existingItem.lists.shopping = {
            completed: false,
            createdAt: Date.now(),
            order: shoppingItemsCount,
            quantity: shoppingQuantity,
            unit: shoppingUnit,
          };
        }

        // Update category if provided
        if (category) {
          existingItem.category = category;
        }
      } else {
        // Create new item
        const autoCategory = category || autoCategorizeItem(name);
        const newItem: Item = {
          id: `${Date.now()}-${Math.random()}`,
          name: name.trim(),
          quantity: quantity || "1",
          unit: unit,
          category: autoCategory,
          lists: {},
        };

        if (listType === "pantry") {
          const pantryItemsCount = state.items.filter(
            (i) => i.lists.pantry
          ).length;
          newItem.lists.pantry = {
            expirationDate,
            addedDate: Date.now(),
            order: pantryItemsCount,
            quantity,
            unit,
          };
        } else {
          const shoppingItemsCount = state.items.filter(
            (i) => i.lists.shopping
          ).length;
          newItem.lists.shopping = {
            completed: false,
            createdAt: Date.now(),
            order: shoppingItemsCount,
            quantity,
            unit,
          };
        }

        state.items.push(newItem);
      }
    },

    // Remove item from a specific list
    removeItemFromList: (
      state,
      action: PayloadAction<{ itemId: string; listType: "pantry" | "shopping" }>
    ) => {
      const { itemId, listType } = action.payload;
      const item = state.items.find((i) => i.id === itemId);

      if (item) {
        delete item.lists[listType];

        // If item is no longer in any list, remove it completely
        if (!item.lists.pantry && !item.lists.shopping) {
          state.items = state.items.filter((i) => i.id !== itemId);
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
        listType?: "pantry" | "shopping"; // Optional: which list is being updated
      }>
    ) => {
      const { itemId, name, quantity, unit, category, listType } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      debugger;
      if (item) {
        if (name !== undefined) item.name = name;
        if (category !== undefined) item.category = category;

        // Update list-specific quantity/unit if listType is specified
        if (listType) {
          if (listType === "pantry" && item.lists.pantry) {
            if (quantity !== undefined) item.lists.pantry.quantity = quantity;
            if (unit !== undefined) item.lists.pantry.unit = unit;
          } else if (listType === "shopping" && item.lists.shopping) {
            if (quantity !== undefined) item.lists.shopping.quantity = quantity;
            if (unit !== undefined) item.lists.shopping.unit = unit;

            // Save as shopping preferences for future adds
            if (quantity !== undefined || unit !== undefined) {
              item.shoppingPreferences = {
                quantity: quantity !== undefined ? quantity : item.lists.shopping.quantity || item.quantity,
                unit: unit !== undefined ? unit : item.lists.shopping.unit,
              };
            }
          }
        } else {
          // Legacy behavior: update core quantity/unit
          if (quantity !== undefined) item.quantity = quantity;
          if (unit !== undefined) item.unit = unit;
        }
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
      const item = state.items.find((i) => i.id === itemId);

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
      const item = state.items.find((i) => i.id === itemId);

      if (item && item.lists.shopping) {
        Object.assign(item.lists.shopping, metadata);
      }
    },

    // Toggle shopping item completion
    toggleShoppingCompleted: (
      state,
      action: PayloadAction<{ itemId: string; addToPantry: boolean }>
    ) => {
      const { itemId, addToPantry } = action.payload;
      const item = state.items.find((i) => i.id === itemId);
      if (item && item.lists.shopping) {
        const wasCompleted = item.lists.shopping.completed;
        item.lists.shopping.completed = !wasCompleted;

        // If marking as completed and item is in pantry, add shopping quantity to pantry (if enabled)
        if (!wasCompleted && addToPantry && item.lists.pantry) {
          // Get the list-specific units (fallback to item unit if not set)
          const shoppingUnit = item.lists.shopping.unit !== undefined
            ? item.lists.shopping.unit
            : (item.unit || "");
          const pantryUnit = item.lists.pantry.unit !== undefined
            ? item.lists.pantry.unit
            : (item.unit || "");

          console.log('Completing shopping item:', {
            name: item.name,
            shoppingUnit,
            pantryUnit,
            match: shoppingUnit === pantryUnit
          });

          // Only add if units match (or both have no unit)
          if (shoppingUnit === pantryUnit) {
            // Get quantities (fallback to item quantity if not set)
            const pantryQtyStr = item.lists.pantry.quantity !== undefined
              ? item.lists.pantry.quantity
              : item.quantity;
            const shoppingQtyStr = item.lists.shopping.quantity !== undefined
              ? item.lists.shopping.quantity
              : item.quantity;

            const pantryQty = parseFloat(pantryQtyStr || "0") || 0;
            const shoppingQty = parseFloat(shoppingQtyStr || "0") || 0;
            const newQty = pantryQty + shoppingQty;

            console.log('Adding quantities:', {
              pantryQty,
              shoppingQty,
              newQty,
              hasListSpecificQty: item.lists.pantry.quantity !== undefined
            });

            // Update the pantry quantity
            if (item.lists.pantry.quantity !== undefined) {
              item.lists.pantry.quantity = newQty.toString();
            } else {
              // If no list-specific quantity, update core quantity
              item.quantity = newQty.toString();
            }
          }
        }
      }
    },

    // Update item category
    updateItemCategory: (
      state,
      action: PayloadAction<{ itemId: string; category: string }>
    ) => {
      const item = state.items.find((i) => i.id === action.payload.itemId);
      if (item) {
        item.category = action.payload.category;
      }
    },

    // Reorder items in pantry
    reorderPantryItems: (state, action: PayloadAction<Item[]>) => {
      action.payload.forEach((item, index) => {
        const stateItem = state.items.find((i) => i.id === item.id);
        if (stateItem && stateItem.lists.pantry) {
          stateItem.lists.pantry.order = index;
          // Also update the item properties
          stateItem.name = item.name;
          stateItem.quantity = item.quantity;
          stateItem.category = item.category;
          if (item.lists.pantry) {
            stateItem.lists.pantry.expirationDate =
              item.lists.pantry.expirationDate;
          }
        }
      });
    },

    // Reorder items in shopping
    reorderShoppingItems: (state, action: PayloadAction<Item[]>) => {
      action.payload.forEach((item, index) => {
        const stateItem = state.items.find((i) => i.id === item.id);
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
      itemsToProcess.forEach((item) => {
        if (item.lists.shopping?.completed) {
          const stateItem = state.items.find((i) => i.id === item.id);
          if (stateItem) {
            delete stateItem.lists.shopping;

            // Remove item completely if not in any other list
            if (!stateItem.lists.pantry) {
              state.items = state.items.filter((i) => i.id !== item.id);
            }
          }
        }
      });
    },

    // Uncheck all shopping items
    uncheckAllShopping: (state) => {
      state.items.forEach((item) => {
        if (item.lists.shopping) {
          item.lists.shopping.completed = false;
        }
      });
    },

    // Clear expired pantry items
    clearExpiredPantry: (state) => {
      const now = Date.now();
      const itemsToProcess = [...state.items];
      itemsToProcess.forEach((item) => {
        if (
          item.lists.pantry?.expirationDate &&
          item.lists.pantry.expirationDate <= now
        ) {
          const stateItem = state.items.find((i) => i.id === item.id);
          if (stateItem) {
            delete stateItem.lists.pantry;

            // Remove item completely if not in any other list
            if (!stateItem.lists.shopping) {
              state.items = state.items.filter((i) => i.id !== item.id);
            }
          }
        }
      });
    },

    // Clear all items from a list
    clearAllFromList: (state, action: PayloadAction<"pantry" | "shopping">) => {
      const listType = action.payload;
      const itemsToProcess = [...state.items];

      itemsToProcess.forEach((item) => {
        const stateItem = state.items.find((i) => i.id === item.id);
        if (stateItem) {
          delete stateItem.lists[listType];

          // Remove item completely if not in any other list
          if (!stateItem.lists.pantry && !stateItem.lists.shopping) {
            state.items = state.items.filter((i) => i.id !== item.id);
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
      action: PayloadAction<{
        ingredients: Array<{ name: string; quantity: string }>;
      }>
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
          // Only subtract if the pantry item has a unit
          if (!pantryItem.unit) {
            return; // Skip items without units
          }

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
