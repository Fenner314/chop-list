import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  completed: boolean;
  createdAt: number;
  order?: number;
}

interface ShoppingListState {
  items: ShoppingListItem[];
}

const initialState: ShoppingListState = {
  items: [],
};

const shoppingListSlice = createSlice({
  name: 'shoppingList',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<ShoppingListItem, 'id' | 'createdAt'>>) => {
      const newItem: ShoppingListItem = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: Date.now(),
      };
      state.items.push(newItem);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    toggleItemCompleted: (state, action: PayloadAction<string>) => {
      const item = state.items.find(item => item.id === action.payload);
      if (item) {
        item.completed = !item.completed;
      }
    },
    updateItem: (state, action: PayloadAction<ShoppingListItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    clearCompleted: (state) => {
      state.items = state.items.filter(item => !item.completed);
    },
    uncheckAll: (state) => {
      state.items.forEach(item => {
        if (item.completed) {
          item.completed = false;
        }
      });
    },
    clearAll: (state) => {
      state.items = [];
    },
    reorderItems: (state, action: PayloadAction<ShoppingListItem[]>) => {
      const reorderedItems = action.payload.map((item, index) => ({
        ...item,
        order: index,
      }));
      state.items = reorderedItems;
    },
    updateItemCategory: (state, action: PayloadAction<{ id: string; category: string }>) => {
      const item = state.items.find(item => item.id === action.payload.id);
      if (item) {
        item.category = action.payload.category;
      }
    },
    addItemsFromPantry: (state, action: PayloadAction<Array<{ name: string; quantity: string; category: string }>>) => {
      const newItems = action.payload.map(item => ({
        ...item,
        id: `${Date.now()}-${Math.random()}`,
        completed: false,
        createdAt: Date.now(),
        order: state.items.length,
      }));
      state.items.push(...newItems);
    },
  },
});

export const {
  addItem,
  removeItem,
  toggleItemCompleted,
  updateItem,
  clearCompleted,
  uncheckAll,
  clearAll,
  reorderItems,
  updateItemCategory,
  addItemsFromPantry,
} = shoppingListSlice.actions;

export default shoppingListSlice.reducer;
