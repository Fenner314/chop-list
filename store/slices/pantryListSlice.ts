import { autoCategorizeItem } from "@/utils/categorization";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface PantryListItem {
  id: string;
  name: string;
  quantity: string;
  category: string; // Now required, will default to 'other' if not specified
  expirationDate?: number;
  addedDate: number;
  order: number; // For manual ordering within categories
}

interface PantryListState {
  items: PantryListItem[];
}

const initialState: PantryListState = {
  items: [],
};

const pantryListSlice = createSlice({
  name: "pantryList",
  initialState,
  reducers: {
    addItem: (
      state,
      action: PayloadAction<
        Omit<PantryListItem, "id" | "addedDate" | "order"> & {
          category?: string;
        }
      >
    ) => {
      // Auto-categorize if no category provided
      const category =
        action.payload.category || autoCategorizeItem(action.payload.name);

      const newItem: PantryListItem = {
        name: action.payload.name,
        quantity: action.payload.quantity,
        expirationDate: action.payload.expirationDate,
        category,
        id: Date.now().toString(),
        addedDate: Date.now(),
        order: state.items.length,
      };
      state.items.push(newItem);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    },
    updateItem: (state, action: PayloadAction<PantryListItem>) => {
      const index = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    updateItemCategory: (
      state,
      action: PayloadAction<{ id: string; category: string }>
    ) => {
      const item = state.items.find((item) => item.id === action.payload.id);
      if (item) {
        item.category = action.payload.category;
      }
    },
    reorderItems: (state, action: PayloadAction<PantryListItem[]>) => {
      state.items = action.payload.map((item, index) => ({
        ...item,
        order: index,
      }));
    },
    clearExpired: (state) => {
      const now = Date.now();
      state.items = state.items.filter(
        (item) => !item.expirationDate || item.expirationDate > now
      );
    },
    clearAll: (state) => {
      state.items = [];
    },
  },
});

export const {
  addItem,
  removeItem,
  updateItem,
  updateItemCategory,
  reorderItems,
  clearExpired,
  clearAll,
} = pantryListSlice.actions;

export default pantryListSlice.reducer;
