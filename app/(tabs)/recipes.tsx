import { AddRecipeModal } from "@/components/add-recipe-modal";
import { AnimatedCaret } from "@/components/animated-caret";
import { ChopText } from "@/components/chop-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectPantryItems,
  selectShoppingItems,
} from "@/store/selectors/itemsSelectors";
import { addItemToList } from "@/store/slices/itemsSlice";
import {
  Recipe,
  RecipeIngredient,
  removeRecipe,
} from "@/store/slices/recipesSlice";
import { formatQuantityWithUnit } from "@/utils/unitConversion";
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
  const shoppingItems = useAppSelector(selectShoppingItems);
  const pantryItems = useAppSelector(selectPantryItems);
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
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    setMultiSelectMode(true);
    // Select all ingredients of this recipe when long-pressing
    const recipeIngredientIds = recipe.ingredients.map((ing) => ing.id);
    setSelectedIngredients(new Set(recipeIngredientIds));
  };

  const handleLongPressIngredient = (ingredientId: string) => {
    setMultiSelectMode(true);
    setSelectedIngredients(new Set([ingredientId]));
  };

  const handleToggleRecipe = (recipeId: string) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return;

    const recipeIngredientIds = recipe.ingredients.map((ing) => ing.id);
    const allSelected = recipeIngredientIds.every((id) =>
      selectedIngredients.has(id)
    );

    const newSelectedIngredients = new Set(selectedIngredients);

    if (allSelected) {
      // Deselect all ingredients of this recipe
      recipeIngredientIds.forEach((id) => newSelectedIngredients.delete(id));
    } else {
      // Select all ingredients of this recipe
      recipeIngredientIds.forEach((id) => newSelectedIngredients.add(id));
    }

    setSelectedIngredients(newSelectedIngredients);

    if (newSelectedIngredients.size === 0) {
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

    if (newSelected.size === 0) {
      setMultiSelectMode(false);
    }
  };

  // Helper function to get recipe checkbox state
  const getRecipeCheckboxState = (recipe: Recipe): 'checked' | 'indeterminate' | 'unchecked' => {
    const recipeIngredientIds = recipe.ingredients.map((ing) => ing.id);
    const selectedCount = recipeIngredientIds.filter((id) =>
      selectedIngredients.has(id)
    ).length;

    if (selectedCount === 0) return 'unchecked';
    if (selectedCount === recipeIngredientIds.length) return 'checked';
    return 'indeterminate';
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedIngredients(new Set());
  };

  const handleSelectAll = () => {
    // Select all ingredients from all recipes
    const allIngredientIds = new Set(
      recipes.flatMap(recipe => recipe.ingredients.map(ing => ing.id))
    );
    setSelectedIngredients(allIngredientIds);
  };

  const handleAddToPantry = () => {
    const ingredientsToAdd: RecipeIngredient[] = [];

    // Add all selected ingredients
    selectedIngredients.forEach((ingredientId) => {
      const ingredient = recipes
        .flatMap((r) => r.ingredients)
        .find((ing) => ing.id === ingredientId);
      if (ingredient) {
        ingredientsToAdd.push(ingredient);
      }
    });

    // Filter out duplicates already in pantry list (items already have pantry metadata)
    const itemsToAdd = ingredientsToAdd.filter((ingredient) => {
      return !pantryItems.some(
        (pantryItem) =>
          pantryItem.name.toLowerCase() === ingredient.name.toLowerCase()
      );
    });

    const duplicateCount = ingredientsToAdd.length - itemsToAdd.length;

    // Add to pantry list
    itemsToAdd.forEach((ingredient) => {
      dispatch(
        addItemToList({
          listType: 'pantry',
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category || "other",
        })
      );
    });

    // Show message
    if (itemsToAdd.length > 0 && duplicateCount > 0) {
      Alert.alert(
        "Added to Pantry List",
        `${itemsToAdd.length} item${
          itemsToAdd.length > 1 ? "s" : ""
        } added. ${duplicateCount} item${
          duplicateCount > 1 ? "s were" : " was"
        } already in pantry list.`,
        [{ text: "OK" }]
      );
    } else if (itemsToAdd.length > 0) {
      Alert.alert(
        "Added to Pantry List",
        `${itemsToAdd.length} item${
          itemsToAdd.length > 1 ? "s" : ""
        } added to pantry list`,
        [{ text: "OK" }]
      );
    } else {
      Alert.alert(
        "Already in Pantry List",
        "All selected items are already in your pantry list",
        [{ text: "OK" }]
      );
    }

    setMultiSelectMode(false);
    setSelectedIngredients(new Set());
  };

  const handleAddToShopping = () => {
    const ingredientsToAdd: RecipeIngredient[] = [];

    // Add all selected ingredients
    selectedIngredients.forEach((ingredientId) => {
      const ingredient = recipes
        .flatMap((r) => r.ingredients)
        .find((ing) => ing.id === ingredientId);
      if (ingredient) {
        ingredientsToAdd.push(ingredient);
      }
    });

    // Filter out duplicates already in shopping list (items already have shopping metadata)
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
        addItemToList({
          listType: 'shopping',
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          category: ingredient.category || "other",
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
  };

  const totalSelected = selectedIngredients.size;

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
                  onPress={handleSelectAll}
                  style={styles.toolbarButton}
                >
                  <ChopText size="small" variant="theme">
                    Select All
                  </ChopText>
                </TouchableOpacity>
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
          <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
            {recipes.map((recipe) => {
              const isExpanded = expandedRecipes.has(recipe.id);
              const checkboxState = getRecipeCheckboxState(recipe);
              const isSelected = checkboxState === 'checked' || checkboxState === 'indeterminate';

              return (
                <View key={recipe.id} style={styles.recipeContainer}>
                  <View
                    style={[
                      styles.recipeHeader,
                      { backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5" },
                      isSelected && {
                        backgroundColor: darkMode ? "#1c3a4a" : "#e3f2fd",
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.recipeHeaderMain}
                      onPress={() => toggleRecipe(recipe.id)}
                      onLongPress={() => handleLongPressRecipe(recipe.id)}
                    >
                      {multiSelectMode && (
                        <TouchableOpacity
                          style={styles.checkbox}
                          onPress={() => handleToggleRecipe(recipe.id)}
                        >
                          <IconSymbol
                            name={
                              checkboxState === 'checked'
                                ? "checkmark.circle.fill"
                                : checkboxState === 'indeterminate'
                                ? "minus.circle.fill"
                                : "circle"
                            }
                            size={24}
                            color={
                              isSelected
                                ? themeColor
                                : darkMode
                                ? "#666"
                                : "#ccc"
                            }
                          />
                        </TouchableOpacity>
                      )}
                      <View style={styles.recipeHeaderContent}>
                        <ChopText size="large" weight="semibold" numberOfLines={1}>
                          {recipe.name}
                        </ChopText>
                        {recipe.description && (
                          <ChopText
                            size="small"
                            variant="muted"
                            style={{ marginTop: 4 }}
                            numberOfLines={2}
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
                      <View style={styles.recipeActionsInline}>
                        {!multiSelectMode && (
                          <>
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
                          </>
                        )}
                        <AnimatedCaret
                          isExpanded={isExpanded}
                          color={darkMode ? "#999" : "#666"}
                          size={20}
                        />
                      </View>
                    </TouchableOpacity>
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
                              multiSelectMode
                                ? handleToggleIngredient(ingredient.id)
                                : handleLongPressIngredient(ingredient.id)
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
                                {formatQuantityWithUnit(
                                  ingredient.quantity,
                                  ingredient.unit
                                )}
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

        {/* Floating Action Buttons */}
        {!multiSelectMode ? (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: themeColor }]}
            onPress={handleAddNew}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={28} color="#fff" />
          </TouchableOpacity>
        ) : (
          <>
            {/* Add to Pantry Button */}
            <TouchableOpacity
              style={[styles.fabSecondary, { backgroundColor: themeColor }]}
              onPress={handleAddToPantry}
              activeOpacity={0.8}
            >
              <IconSymbol name="archivebox.fill" size={24} color="#fff" />
              <ChopText
                size="xs"
                weight="bold"
                color="#fff"
                style={{ marginTop: 2 }}
              >
                Add to Pantry
              </ChopText>
            </TouchableOpacity>

            {/* Add to Shopping Button */}
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
          </>
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
  listContent: {
    paddingBottom: 100,
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
  recipeActionsInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
  fabSecondary: {
    position: "absolute",
    right: 20,
    bottom: 90,
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
