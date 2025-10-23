import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PantryListItem {
  id: string;
  name: string;
  quantity: string;
  category?: string;
  expirationDate?: number;
  addedDate: number;
}

interface PantryListState {
  items: PantryListItem[];
}

const initialState: PantryListState = {
  items: [],
};

const pantryListSlice = createSlice({
  name: 'pantryList',
  initialState,
  reducers: {
    addItem: (state, action: PayloadAction<Omit<PantryListItem, 'id' | 'addedDate'>>) => {
      const newItem: PantryListItem = {
        ...action.payload,
        id: Date.now().toString(),
        addedDate: Date.now(),
      };
      state.items.push(newItem);
    },
    removeItem: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.id !== action.payload);
    },
    updateItem: (state, action: PayloadAction<PantryListItem>) => {
      const index = state.items.findIndex(item => item.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    clearExpired: (state) => {
      const now = Date.now();
      state.items = state.items.filter(item => !item.expirationDate || item.expirationDate > now);
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
  clearExpired,
  clearAll,
} = pantryListSlice.actions;

export default pantryListSlice.reducer;
