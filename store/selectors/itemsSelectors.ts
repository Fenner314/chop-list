import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../index';
import { Item } from '../slices/itemsSlice';

// Base selector
export const selectAllItems = (state: RootState) => state.items?.items || [];

// Get items that are in the pantry list
export const selectPantryItems = createSelector(
  [selectAllItems],
  (items): Item[] => {
    return items
      .filter((item) => item.lists.pantry !== undefined)
      .sort((a, b) => {
        const orderA = a.lists.pantry?.order ?? 0;
        const orderB = b.lists.pantry?.order ?? 0;
        return orderA - orderB;
      });
  }
);

// Get items that are in the shopping list
export const selectShoppingItems = createSelector(
  [selectAllItems],
  (items): Item[] => {
    return items
      .filter((item) => item.lists.shopping !== undefined)
      .sort((a, b) => {
        const orderA = a.lists.shopping?.order ?? 0;
        const orderB = b.lists.shopping?.order ?? 0;
        return orderA - orderB;
      });
  }
);

// Get active (uncompleted) shopping items
export const selectActiveShoppingItems = createSelector(
  [selectShoppingItems],
  (items): Item[] => {
    return items.filter((item) => !item.lists.shopping?.completed);
  }
);

// Get completed shopping items
export const selectCompletedShoppingItems = createSelector(
  [selectShoppingItems],
  (items): Item[] => {
    return items.filter((item) => item.lists.shopping?.completed);
  }
);

// Get items grouped by category for pantry
export const selectPantryItemsByCategory = createSelector(
  [selectPantryItems],
  (items) => {
    const grouped = new Map<string, Item[]>();
    items.forEach((item) => {
      const category = item.category || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });
    return grouped;
  }
);

// Get items grouped by category for shopping
export const selectShoppingItemsByCategory = createSelector(
  [selectShoppingItems],
  (items) => {
    const grouped = new Map<string, Item[]>();
    items.forEach((item) => {
      const category = item.category || 'other';
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });
    return grouped;
  }
);

// Find item by ID
export const selectItemById = (itemId: string) =>
  createSelector([selectAllItems], (items) =>
    items.find((item) => item.id === itemId)
  );

// Check if item exists in pantry by name (case-insensitive)
export const selectItemExistsInPantry = (name: string) =>
  createSelector([selectPantryItems], (items) =>
    items.some((item) => item.name.toLowerCase() === name.toLowerCase())
  );

// Check if item exists in shopping by name (case-insensitive)
export const selectItemExistsInShopping = (name: string) =>
  createSelector([selectShoppingItems], (items) =>
    items.some((item) => item.name.toLowerCase() === name.toLowerCase())
  );
