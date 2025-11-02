import { AddRecipeModal } from "@/components/add-recipe-modal";
import { ChopText } from "@/components/chop-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Recipe,
  RecipeIngredient,
  removeRecipe,
} from "@/store/slices/recipesSlice";
import { addItem as addShoppingItem } from "@/store/slices/shoppingListSlice";
import React, { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipesScreen() {
  const dispatch = useAppDispatch();
  const recipes = useAppSelector((state) => state.recipes.recipes);
  const shoppingItems = useAppSelector((state) => state.shoppingList.items);
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  const [modalVisible, setModalVisible] = useState(false);
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>();
  const [expandedRecipes, setExpandedRecipes] = useState<Set<string>>(
    new Set()
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(
    new Set()
  );
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(
    new Set()
  );

  const toggleRecipe = (recipeId: string) => {
    const newExpanded = new Set(expandedRecipes);
    if (newExpanded.has(recipeId)) {
      newExpanded.delete(recipeId);
    } else {
      newExpanded.add(recipeId);
    }
    setExpandedRecipes(newExpanded);
  };

  const handleAddNew = () => {
    setEditRecipe(undefined);
    setModalVisible(true);
  };

  const handleEditRecipe = (recipe: Recipe) => {
    if (multiSelectMode) return;
    setEditRecipe(recipe);
    setModalVisible(true);
  };

  const handleDeleteRecipe = (recipeId: string) => {
    Alert.alert(
      "Delete Recipe",
      "Are you sure you want to delete this recipe?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(removeRecipe(recipeId)),
        },
      ]
    );
  };

  const handleLongPressRecipe = (recipeId: string) => {
    setMultiSelectMode(true);
    setSelectedRecipes(new Set([recipeId]));
  };

  const handleLongPressIngredient = (ingredientId: string) => {
    setMultiSelectMode(true);
    setSelectedIngredients(new Set([ingredientId]));
  };

  const handleToggleRecipe = (recipeId: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeId)) {
      newSelected.delete(recipeId);
    } else {
      newSelected.add(recipeId);
    }
    setSelectedRecipes(newSelected);

    if (newSelected.size === 0 && selectedIngredients.size === 0) {
      setMultiSelectMode(false);
    }
  };

  const handleToggleIngredient = (ingredientId: string) => {
    const newSelected = new Set(selectedIngredients);
    if (newSelected.has(ingredientId)) {
      newSelected.delete(ingredientId);
    } else {
      newSelected.add(ingredientId);
    }
    setSelectedIngredients(newSelected);

    if (newSelected.size === 0 && selectedRecipes.size === 0) {
      setMultiSelectMode(false);
    }
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedIngredients(new Set());
    setSelectedRecipes(new Set());
  };

  const handleAddToShopping = () => {
    const ingredientsToAdd: RecipeIngredient[] = [];

    // Add all ingredients from selected recipes
    selectedRecipes.forEach((recipeId) => {
      const recipe = recipes.find((r) => r.id === recipeId);
      if (recipe) {
        ingredientsToAdd.push(...recipe.ingredients);
      }
    });

    // Add individually selected ingredients
    selectedIngredients.forEach((ingredientId) => {
      const ingredient = recipes
        .flatMap((r) => r.ingredients)
        .find((ing) => ing.id === ingredientId);
      if (ingredient) {
        ingredientsToAdd.push(ingredient);
      }
    });

    // Filter out duplicates already in shopping list
    const itemsToAdd = ingredientsToAdd.filter((ingredient) => {
      return !shoppingItems.some(
        (shopItem) =>
          shopItem.name.toLowerCase() === ingredient.name.toLowerCase()
      );
    });

    const duplicateCount = ingredientsToAdd.length - itemsToAdd.length;

    // Add to shopping list
    itemsToAdd.forEach((ingredient) => {
      dispatch(
        addShoppingItem({
          name: ingredient.name,
          quantity: ingredient.quantity,
          category: ingredient.category || "other",
          completed: false,
        })
      );
    });

    // Show message
    if (itemsToAdd.length > 0 && duplicateCount > 0) {
      Alert.alert(
        "Added to Shopping List",
        `${itemsToAdd.length} item${
          itemsToAdd.length > 1 ? "s" : ""
        } added. ${duplicateCount} item${
          duplicateCount > 1 ? "s were" : " was"
        } already in shopping list.`,
        [{ text: "OK" }]
      );
    } else if (itemsToAdd.length > 0) {
      Alert.alert(
        "Added to Shopping List",
        `${itemsToAdd.length} item${
          itemsToAdd.length > 1 ? "s" : ""
        } added to shopping list`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Already in Shopping List",
        "All selected items are already in your shopping list",
        [{ text: "OK" }]
      );
    }

    setMultiSelectMode(false);
    setSelectedIngredients(new Set());
    setSelectedRecipes(new Set());
  };

  const totalSelected = selectedIngredients.size + selectedRecipes.size;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
      edges={["top"]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <ChopText
            size="xxl"
            weight="bold"
            variant="theme"
            style={styles.title}
          >
            Recipes
          </ChopText>
          {multiSelectMode && (
            <View style={styles.multiSelectToolbar}>
              <ChopText size="small" variant="muted">
                {totalSelected} selected
              </ChopText>
              <View style={styles.toolbarActions}>
                <TouchableOpacity
                  onPress={handleCancelMultiSelect}
                  style={styles.toolbarButton}
                >
                  <ChopText size="small" variant="theme">
                    Cancel
                  </ChopText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {recipes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ChopText size="medium" variant="muted" useGlobalFontSize>
              No recipes yet
            </ChopText>
            <ChopText size="small" variant="muted" style={styles.emptySubtext}>
              Tap the + button to add your first recipe
            </ChopText>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {recipes.map((recipe) => {
              const isExpanded = expandedRecipes.has(recipe.id);
              const isRecipeSelected = selectedRecipes.has(recipe.id);

              return (
                <View key={recipe.id} style={styles.recipeContainer}>
                  <View
                    style={[
                      styles.recipeHeader,
                      { backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5" },
                      isRecipeSelected && {
                        backgroundColor: darkMode ? "#1c3a4a" : "#e3f2fd",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.recipeHeaderMain}
                      onPress={() =>
                        multiSelectMode
                          ? handleToggleRecipe(recipe.id)
                          : toggleRecipe(recipe.id)
                      }
                      onLongPress={() => handleLongPressRecipe(recipe.id)}
                    >
                      {multiSelectMode && (
                        <View style={styles.checkbox}>
                          <IconSymbol
                            name={
                              isRecipeSelected ? "checkmark.circle" : "circle"
                            }
                            size={24}
                            color={
                              isRecipeSelected
                                ? themeColor
                                : darkMode
                                ? "#666"
                                : "#ccc"
                            }
                          />
                        </View>
                      )}
                      <View style={styles.recipeHeaderContent}>
                        <ChopText size="large" weight="semibold">
                          {recipe.name}
                        </ChopText>
                        {recipe.description && (
                          <ChopText
                            size="small"
                            variant="muted"
                            style={{ marginTop: 4 }}
                          >
                            {recipe.description}
                          </ChopText>
                        )}
                        <View style={styles.recipeFooter}>
                          <ChopText size="xs" variant="muted">
                            {recipe.ingredients.length} ingredient
                            {recipe.ingredients.length !== 1 ? "s" : ""}
                          </ChopText>
                          <ChopText size="xs" variant="muted">
                            Serves {recipe.servings}
                          </ChopText>
                        </View>
                      </View>
                      {!multiSelectMode && (
                        <ChopText size="large">
                          {isExpanded ? "−" : "+"}
                        </ChopText>
                      )}
                    </TouchableOpacity>
                    {!multiSelectMode && (
                      <View style={styles.recipeActions}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditRecipe(recipe)}
                        >
                          <IconSymbol
                            name="pencil"
                            size={18}
                            color={darkMode ? "#666" : "#999"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleDeleteRecipe(recipe.id)}
                        >
                          <IconSymbol name="trash" size={18} color="#ff3b30" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {isExpanded && (
                    <View style={styles.ingredientsList}>
                      {recipe.ingredients.map((ingredient) => {
                        const isIngredientSelected = selectedIngredients.has(
                          ingredient.id
                        );

                        return (
                          <TouchableOpacity
                            key={ingredient.id}
                            style={[
                              styles.ingredientItem,
                              { borderBottomColor: darkMode ? "#333" : "#eee" },
                              isIngredientSelected && {
                                backgroundColor: darkMode
                                  ? "#1c3a4a"
                                  : "#e3f2fd",
                              },
                            ]}
                            onPress={() =>
                              multiSelectMode &&
                              handleToggleIngredient(ingredient.id)
                            }
                            onLongPress={() =>
                              handleLongPressIngredient(ingredient.id)
                            }
                          >
                            {multiSelectMode && (
                              <View style={styles.checkbox}>
                                <IconSymbol
                                  name={
                                    isIngredientSelected
                                      ? "checkmark.circle"
                                      : "circle"
                                  }
                                  size={20}
                                  color={
                                    isIngredientSelected
                                      ? themeColor
                                      : darkMode
                                      ? "#666"
                                      : "#ccc"
                                  }
                                />
                              </View>
                            )}
                            <View style={styles.ingredientContent}>
                              <View
                                style={{
                                  flexDirection: "row",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <ChopText size="medium" useGlobalFontSize>
                                  {ingredient.name}
                                </ChopText>
                                {shoppingItems.some(
                                  (shopItem) =>
                                    shopItem.name.toLowerCase() ===
                                    ingredient.name.toLowerCase()
                                ) && (
                                  <IconSymbol
                                    name="cart.fill"
                                    size={14}
                                    color={themeColor}
                                  />
                                )}
                              </View>
                              <ChopText size="small" variant="muted">
                                {ingredient.quantity}
                              </ChopText>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}

        {/* Floating Action Button */}
        {!multiSelectMode ? (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: themeColor }]}
            onPress={handleAddNew}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: themeColor }]}
            onPress={handleAddToShopping}
            activeOpacity={0.8}
          >
            <IconSymbol name="cart.fill" size={24} color="#fff" />
            <ChopText
              size="xs"
              weight="bold"
              color="#fff"
              style={{ marginTop: 2 }}
            >
              Add to Shopping
            </ChopText>
          </TouchableOpacity>
        )}

        <AddRecipeModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setEditRecipe(undefined);
          }}
          editRecipe={editRecipe}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    marginBottom: 12,
  },
  multiSelectToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  toolbarActions: {
    flexDirection: "row",
    gap: 16,
    alignItems: "center",
  },
  toolbarButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySubtext: {
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  recipeContainer: {
    marginBottom: 12,
  },
  recipeHeader: {
    borderRadius: 8,
    overflow: "hidden",
  },
  recipeHeaderMain: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  checkbox: {
    marginRight: 12,
  },
  recipeHeaderContent: {
    flex: 1,
  },
  recipeFooter: {
    flexDirection: "row",
    gap: 16,
    marginTop: 8,
  },
  recipeActions: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
    justifyContent: "flex-end",
  },
  actionButton: {
    padding: 8,
  },
  ingredientsList: {
    marginTop: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingLeft: 32,
    borderBottomWidth: 1,
  },
  ingredientContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    minWidth: 60,
    minHeight: 60,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
