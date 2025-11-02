import { Item } from '../slices/itemsSlice';
import { PantryListItem } from '../slices/pantryListSlice';
import { ShoppingListItem } from '../slices/shoppingListSlice';

/**
 * Migrates items from separate pantry and shopping list slices to centralized items slice
 */
export function migrateToItemsSlice(
  pantryItems: PantryListItem[],
  shoppingItems: ShoppingListItem[]
): Item[] {
  const itemsMap = new Map<string, Item>();

  // Process pantry items first
  pantryItems.forEach((pantryItem) => {
    const key = pantryItem.name.toLowerCase();

    if (!itemsMap.has(key)) {
      // Create new centralized item
      itemsMap.set(key, {
        id: pantryItem.id,
        name: pantryItem.name,
        quantity: pantryItem.quantity,
        category: pantryItem.category,
        lists: {
          pantry: {
            expirationDate: pantryItem.expirationDate,
            addedDate: pantryItem.addedDate,
            order: pantryItem.order,
          },
        },
      });
    }
  });

  // Process shopping items
  shoppingItems.forEach((shoppingItem) => {
    const key = shoppingItem.name.toLowerCase();

    if (itemsMap.has(key)) {
      // Item already exists (from pantry), add shopping metadata
      const existingItem = itemsMap.get(key)!;
      existingItem.lists.shopping = {
        completed: shoppingItem.completed,
        createdAt: shoppingItem.createdAt,
        order: shoppingItem.order || 0,
      };
      // Use shopping list's quantity if different (user may have updated it)
      // Keep the more recent data
    } else {
      // Create new item with only shopping metadata
      itemsMap.set(key, {
        id: shoppingItem.id,
        name: shoppingItem.name,
        quantity: shoppingItem.quantity,
        category: shoppingItem.category,
        lists: {
          shopping: {
            completed: shoppingItem.completed,
            createdAt: shoppingItem.createdAt,
            order: shoppingItem.order || 0,
          },
        },
      });
    }
  });

  return Array.from(itemsMap.values());
}
