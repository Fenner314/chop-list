import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface RecipeIngredient {
  id: string;
  name: string;
  quantity: string;
  category?: string;
}

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  servings: number;
  ingredients: RecipeIngredient[];
  instructions?: string[];
  createdAt: number;
  updatedAt: number;
}

interface RecipesState {
  recipes: Recipe[];
}

const initialState: RecipesState = {
  recipes: [],
};

const recipesSlice = createSlice({
  name: 'recipes',
  initialState,
  reducers: {
    addRecipe: (state, action: PayloadAction<Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>>) => {
      const newRecipe: Recipe = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      state.recipes.push(newRecipe);
    },
    removeRecipe: (state, action: PayloadAction<string>) => {
      state.recipes = state.recipes.filter(recipe => recipe.id !== action.payload);
    },
    updateRecipe: (state, action: PayloadAction<Recipe>) => {
      const index = state.recipes.findIndex(recipe => recipe.id === action.payload.id);
      if (index !== -1) {
        state.recipes[index] = {
          ...action.payload,
          updatedAt: Date.now(),
        };
      }
    },
    addIngredientToRecipe: (state, action: PayloadAction<{ recipeId: string; ingredient: Omit<RecipeIngredient, 'id'> }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.recipeId);
      if (recipe) {
        const newIngredient: RecipeIngredient = {
          ...action.payload.ingredient,
          id: Date.now().toString(),
        };
        recipe.ingredients.push(newIngredient);
        recipe.updatedAt = Date.now();
      }
    },
    removeIngredientFromRecipe: (state, action: PayloadAction<{ recipeId: string; ingredientId: string }>) => {
      const recipe = state.recipes.find(r => r.id === action.payload.recipeId);
      if (recipe) {
        recipe.ingredients = recipe.ingredients.filter(ing => ing.id !== action.payload.ingredientId);
        recipe.updatedAt = Date.now();
      }
    },
    clearAll: (state) => {
      state.recipes = [];
    },
  },
});

export const {
  addRecipe,
  removeRecipe,
  updateRecipe,
  addIngredientToRecipe,
  removeIngredientFromRecipe,
  clearAll,
} = recipesSlice.actions;

export default recipesSlice.reducer;
