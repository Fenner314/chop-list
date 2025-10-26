import { RootState } from '../index';
import { Item, ItemListMembership } from '../slices/itemsSlice';

// Helper type for items with their membership data
export interface ItemWithMembership {
  id: string;
  name: string;
  category: string;
  createdAt: number;
  membership: ItemListMembership;
}

// Get all items in pantry list
export const selectPantryItems = (state: RootState): ItemWithMembership[] => {
  return Object.values(state.items.items)
    .filter(item => state.items.membership[item.id]?.inPantry)
    .map(item => ({
      ...item,
      membership: state.items.membership[item.id],
    }))
    .sort((a, b) => (a.membership.pantryOrder || 0) - (b.membership.pantryOrder || 0));
};

// Get all items in shopping list (active only)
export const selectShoppingItems = (state: RootState): ItemWithMembership[] => {
  return Object.values(state.items.items)
    .filter(item => state.items.membership[item.id]?.inShopping && !state.items.membership[item.id]?.shoppingCompleted)
    .map(item => ({
      ...item,
      membership: state.items.membership[item.id],
    }))
    .sort((a, b) => (a.membership.shoppingOrder || 0) - (b.membership.shoppingOrder || 0));
};

// Get completed shopping items
export const selectCompletedShoppingItems = (state: RootState): ItemWithMembership[] => {
  return Object.values(state.items.items)
    .filter(item => state.items.membership[item.id]?.inShopping && state.items.membership[item.id]?.shoppingCompleted)
    .map(item => ({
      ...item,
      membership: state.items.membership[item.id],
    }))
    .sort((a, b) => (a.membership.shoppingOrder || 0) - (b.membership.shoppingOrder || 0));
};

// Check if an item name exists in shopping list
export const selectItemInShopping = (state: RootState, itemName: string): boolean => {
  return Object.values(state.items.items).some(item => {
    const membership = state.items.membership[item.id];
    return membership?.inShopping && item.name.toLowerCase() === itemName.toLowerCase();
  });
};

// Find item by name (case-insensitive)
export const selectItemByName = (state: RootState, name: string): Item | undefined => {
  return Object.values(state.items.items).find(
    item => item.name.toLowerCase() === name.toLowerCase()
  );
};
