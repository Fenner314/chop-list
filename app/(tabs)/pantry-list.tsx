import { AddPantryItemModal } from "@/components/add-pantry-item-modal";
import { AddRecipeModal } from "@/components/add-recipe-modal";
import { AnimatedCaret } from "@/components/animated-caret";
import { CategoryModal } from "@/components/category-modal";
import { RecipeSelectorModal } from "@/components/recipe-selector-modal";
import { ChopText } from "@/components/chop-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  PantryListItem,
  removeItem,
  reorderItems,
  updateItemCategory,
} from "@/store/slices/pantryListSlice";
import {
  addIngredientsToRecipe,
  Recipe,
} from "@/store/slices/recipesSlice";
import {
  Category,
  initializeCategories,
  updateCategory,
} from "@/store/slices/settingsSlice";
import { addItem as addShoppingItem } from "@/store/slices/shoppingListSlice";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

// Type for list items that includes both items and category headers
type ListItem =
  | {
      type: "category";
      categoryId: string;
      title: string;
      color: string;
      itemCount: number;
    }
  | { type: "item"; item: PantryListItem; categoryId: string };

export default function PantryListScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.pantryList.items);
  const shoppingItems = useAppSelector((state) => state.shoppingList.items);
  const categories = useAppSelector((state) => state.settings.categories || []);
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);
  const sortBy = useAppSelector(
    (state) => state.settings.pantryListSettings.sortBy
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<PantryListItem | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [moveCategoryModalVisible, setMoveCategoryModalVisible] =
    useState(false);
  const [itemToMove, setItemToMove] = useState<PantryListItem | undefined>();
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [isDraggingMultiple, setIsDraggingMultiple] = useState(false);
  const [recipeSelectorVisible, setRecipeSelectorVisible] = useState(false);
  const [addRecipeModalVisible, setAddRecipeModalVisible] = useState(false);
  const [preselectedIngredients, setPreselectedIngredients] = useState<
    Array<{ name: string; quantity: string; category: string }>
  >([]);

  // Create flat list with category headers and items
  const flatListData = useMemo((): ListItem[] => {
    const data: ListItem[] = [];

    // Sort items within each category
    const sortItems = (itemsList: PantryListItem[]) => {
      switch (sortBy) {
        case "alphabetical":
          return [...itemsList].sort((a, b) => a.name.localeCompare(b.name));
        case "expiration":
          return [...itemsList].sort((a, b) => {
            if (!a.expirationDate) return 1;
            if (!b.expirationDate) return -1;
            return a.expirationDate - b.expirationDate;
          });
        case "manual":
        default:
          return [...itemsList].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    };

    categories.forEach((category) => {
      const categoryItems = items.filter(
        (item) => item.category === category.id
      );
      if (categoryItems.length > 0) {
        // Add category header
        data.push({
          type: "category",
          categoryId: category.id,
          title: category.name,
          color: category.color,
          itemCount: categoryItems.length,
        });

        // Add items if category is expanded
        if (expandedCategories.has(category.id)) {
          sortItems(categoryItems).forEach((item) => {
            data.push({
              type: "item",
              item,
              categoryId: category.id,
            });
          });
        }
      }
    });

    return data;
  }, [items, categories, sortBy, expandedCategories]);

  // Initialize categories if empty (migration from old persisted state)
  useEffect(() => {
    dispatch(initializeCategories());
  }, [dispatch]);

  // Auto-expand categories that have items
  useEffect(() => {
    const categoriesWithItems = new Set(
      categories
        .filter((cat) => items.some((item) => item.category === cat.id))
        .map((cat) => cat.id)
    );

    setExpandedCategories((prev) => {
      const newExpanded = new Set(prev);

      // Add any new categories that now have items
      categoriesWithItems.forEach((catId) => {
        if (!prev.has(catId)) {
          newExpanded.add(catId);
        }
      });

      // Remove categories that no longer have items
      prev.forEach((catId) => {
        if (!categoriesWithItems.has(catId)) {
          newExpanded.delete(catId);
        }
      });

      return newExpanded;
    });
  }, [categories, items]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditItem = (item: PantryListItem) => {
    if (multiSelectMode) return;
    setEditItem(item);
    setModalVisible(true);
  };

  const handleAddNew = () => {
    setEditItem(undefined);
    setModalVisible(true);
  };

  const handleLongPress = (itemId: string) => {
    setMultiSelectMode(true);
    setSelectedItems(new Set([itemId]));
  };

  const handleItemPress = (item: PantryListItem, checked = false) => {
    if (multiSelectMode || checked) {
      if (checked) setMultiSelectMode(true);

      const newSelected = new Set(selectedItems);
      if (newSelected.has(item.id)) {
        newSelected.delete(item.id);
      } else {
        newSelected.add(item.id);
      }
      setSelectedItems(newSelected);

      // Exit multi-select mode if no items selected
      if (newSelected.size === 0) {
        setMultiSelectMode(false);
      }
    } else {
      handleEditItem(item);
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Items",
      `Are you sure you want to delete ${selectedItems.size} item${
        selectedItems.size > 1 ? "s" : ""
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            selectedItems.forEach((itemId) => dispatch(removeItem(itemId)));
            setSelectedItems(new Set());
            setMultiSelectMode(false);
          },
        },
      ]
    );
  };

  const handleCancelMultiSelect = () => {
    setMultiSelectMode(false);
    setSelectedItems(new Set());
  };

  const handleMoveItem = (item: PantryListItem) => {
    setItemToMove(item);
    setMoveCategoryModalVisible(true);
  };

  const handleMoveToCategory = (newCategoryId: string) => {
    if (itemToMove) {
      dispatch(
        updateItemCategory({ id: itemToMove.id, category: newCategoryId })
      );
      setMoveCategoryModalVisible(false);
      setItemToMove(undefined);
    }
  };

  const handleEditCategory = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    if (category) {
      setEditingCategory(category);
      setCategoryModalVisible(true);
    }
  };

  const handleSaveCategory = (categoryData: {
    name: string;
    color: string;
    icon?: string;
  }) => {
    if (editingCategory) {
      dispatch(updateCategory({ ...editingCategory, ...categoryData }));
    }
  };

  const isExpired = (expirationDate?: number) => {
    if (!expirationDate) return false;
    return expirationDate < Date.now();
  };

  const isExpiringSoon = (expirationDate?: number) => {
    if (!expirationDate) return false;
    const warningDays = 7;
    const warningTime = Date.now() + warningDays * 24 * 60 * 60 * 1000;
    return expirationDate <= warningTime && expirationDate > Date.now();
  };

  const handleMoveToShoppingList = () => {
    const selectedItemsArray = items.filter(item => selectedItems.has(item.id));

    // Check which items are already in shopping list (case-insensitive name comparison)
    const itemsToAdd = selectedItemsArray.filter(pantryItem => {
      return !shoppingItems.some(shopItem =>
        shopItem.name.toLowerCase() === pantryItem.name.toLowerCase()
      );
    });

    const duplicateCount = selectedItems.size - itemsToAdd.length;

    // Add only items that aren't already in shopping list
    itemsToAdd.forEach(item => {
      dispatch(addShoppingItem({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
        completed: false,
      }));
    });

    // Show appropriate message
    if (itemsToAdd.length > 0 && duplicateCount > 0) {
      Alert.alert(
        'Added to Shopping List',
        `${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added. ${duplicateCount} item${duplicateCount > 1 ? 's were' : ' was'} already in shopping list.`,
        [{ text: 'OK' }]
      );
    } else if (itemsToAdd.length > 0) {
      Alert.alert(
        'Added to Shopping List',
        `${itemsToAdd.length} item${itemsToAdd.length > 1 ? 's' : ''} added to shopping list`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Already in Shopping List',
        `All selected items are already in your shopping list`,
        [{ text: 'OK' }]
      );
    }

    setSelectedItems(new Set());
    setMultiSelectMode(false);
  };

  const handleAddToRecipe = () => {
    const selectedItemsArray = items.filter(item => selectedItems.has(item.id));

    // Store the selected items to add to recipe
    setPreselectedIngredients(
      selectedItemsArray.map(item => ({
        name: item.name,
        quantity: item.quantity,
        category: item.category,
      }))
    );

    // Show recipe selector
    setRecipeSelectorVisible(true);
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    // Add the selected pantry items as ingredients to the recipe
    dispatch(
      addIngredientsToRecipe({
        recipeId: recipe.id,
        ingredients: preselectedIngredients,
      })
    );

    Alert.alert(
      'Added to Recipe',
      `${preselectedIngredients.length} item${preselectedIngredients.length > 1 ? 's' : ''} added to "${recipe.name}"`,
      [{ text: 'OK' }]
    );

    // Clean up
    setRecipeSelectorVisible(false);
    setPreselectedIngredients([]);
    setSelectedItems(new Set());
    setMultiSelectMode(false);
  };

  const handleCreateNewRecipe = () => {
    // Close recipe selector and open add recipe modal with preselected items
    setRecipeSelectorVisible(false);
    setAddRecipeModalVisible(true);
  };

  const handleCloseAddRecipeModal = () => {
    setAddRecipeModalVisible(false);
    setPreselectedIngredients([]);
    setSelectedItems(new Set());
    setMultiSelectMode(false);
  };

  const handleDragEnd = useCallback(
    ({ data, to }: { data: ListItem[]; to: number }) => {
      setIsDraggingMultiple(false);

      // Build the new item order from the dragged list
      const newItemOrder: PantryListItem[] = [];
      let currentCategory = "";
      let draggedItemIndex = -1;
      let targetCategory = "";
      let draggedItem: PantryListItem | null = null;

      // Extract all items and find where the dragged item landed
      data.forEach((listItem, index) => {
        if (listItem.type === "category") {
          currentCategory = listItem.categoryId;
        } else if (listItem.type === "item") {
          const item = listItem.item;

          // Find the dragged item (the one that was moved from 'from' to 'to')
          if (index === to && multiSelectMode && selectedItems.has(item.id)) {
            draggedItemIndex = newItemOrder.length;
            targetCategory = currentCategory;
            draggedItem = item;
          }

          newItemOrder.push({
            ...item,
            category: currentCategory || item.category,
          });
        }
      });

      // If multiple items selected and we dragged one of them, move all selected together
      if (
        multiSelectMode &&
        selectedItems.size > 1 &&
        draggedItem &&
        draggedItemIndex >= 0
      ) {
        // Get all selected items in their current order
        const selectedArray = items.filter((i) => selectedItems.has(i.id));

        // Update all selected items to target category
        selectedArray.forEach((item) => {
          if (item.category !== targetCategory) {
            dispatch(
              updateItemCategory({ id: item.id, category: targetCategory })
            );
          }
        });

        // Remove all selected items from new order
        const withoutSelected = newItemOrder.filter(
          (i) => !selectedItems.has(i.id)
        );

        // Find the position where we want to insert (adjust for removed items before this position)
        let adjustedIndex = draggedItemIndex;
        for (let i = 0; i < draggedItemIndex; i++) {
          if (selectedItems.has(newItemOrder[i].id)) {
            adjustedIndex--;
          }
        }

        // Insert all selected items at target position with updated category
        const movedSelected = selectedArray.map((i) => ({
          ...i,
          category: targetCategory,
        }));
        withoutSelected.splice(adjustedIndex, 0, ...movedSelected);

        // Dispatch once
        dispatch(reorderItems(withoutSelected));
        return;
      }

      // Single item drag - update categories if changed
      newItemOrder.forEach((item) => {
        const originalItem = items.find((i) => i.id === item.id);
        if (originalItem && originalItem.category !== item.category) {
          dispatch(
            updateItemCategory({ id: item.id, category: item.category })
          );
        }
      });

      dispatch(reorderItems(newItemOrder));
    },
    [dispatch, items, multiSelectMode, selectedItems]
  );

  const renderItem = ({
    item: listItem,
    drag,
    isActive,
  }: RenderItemParams<ListItem>) => {
    if (listItem.type === "category") {
      const isExpanded = expandedCategories.has(listItem.categoryId);
      return (
        <View
          style={[styles.categoryHeader, { backgroundColor: listItem.color }]}
        >
          <TouchableOpacity
            style={styles.categoryHeaderMain}
            onPress={() => toggleCategory(listItem.categoryId)}
          >
            <View style={styles.categoryHeaderContent}>
              <ChopText size="medium" weight="semibold" color="#333">
                {listItem.title}
              </ChopText>
              <ChopText size="small" color="#666">
                {listItem.itemCount}{" "}
                {listItem.itemCount === 1 ? "item" : "items"}
              </ChopText>
            </View>
            <AnimatedCaret isExpanded={isExpanded} color="#333" size={24} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.categoryEditButton}
            onPress={() => handleEditCategory(listItem.categoryId)}
          >
            <IconSymbol name="pencil" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      );
    }

    // Item rendering
    const { item, categoryId } = listItem;
    const expired = isExpired(item.expirationDate);
    const expiringSoon = isExpiringSoon(item.expirationDate);
    const isSelected = selectedItems.has(item.id);

    // When in multi-select mode and dragging, show selected items as semi-transparent
    const itemOpacity =
      multiSelectMode && isSelected && selectedItems.size > 1 && isActive
        ? 0.3
        : 1;

    return (
      <ScaleDecorator>
        <View
          style={[
            styles.itemContainer,
            {
              borderBottomColor: darkMode ? "#333" : "#eee",
              opacity: itemOpacity,
            },
            isSelected &&
              !isActive && {
                backgroundColor: darkMode ? "#1c3a4a" : "#e3f2fd",
              },
            isActive && { backgroundColor: darkMode ? "#2c3e50" : "#bbdefb" },
          ]}
        >
          <TouchableOpacity
            style={styles.checkbox}
            onPress={() => handleItemPress(item, true)}
          >
            <IconSymbol
              name={isSelected ? "checkmark.circle" : "circle"}
              size={24}
              color={isSelected ? themeColor : darkMode ? "#666" : "#ccc"}
            />
          </TouchableOpacity>
          {/* {multiSelectMode && (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleItemPress(item)}
            >
              <IconSymbol
                name={isSelected ? 'checkmark.circle' : 'circle'}
                size={24}
                color={isSelected ? themeColor : darkMode ? '#666' : '#ccc'}
              />
            </TouchableOpacity>
          )} */}
          {/* <View style={styles.dragHandleContainer}>
            <TouchableOpacity
              style={styles.dragHandle}
              onLongPress={drag}
              delayLongPress={0}
            >
              <IconSymbol
                name="line.horizontal.3"
                size={20}
                color={darkMode ? '#666' : '#999'}
              />
            </TouchableOpacity>
            {multiSelectMode && isSelected && selectedItems.size > 1 && !isActive && (
              <View style={[styles.selectedBadge, { backgroundColor: themeColor }]}>
                <ChopText size="xs" weight="bold" color="#fff">
                  {selectedItems.size}
                </ChopText>
              </View>
            )}
          </View> */}
          <TouchableOpacity
            style={styles.itemContent}
            onPress={() => handleItemPress(item)}
            onLongPress={() => handleLongPress(item.id)}
          >
            <View style={styles.itemInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ChopText size="medium" useGlobalFontSize style={styles.itemName}>
                  {item.name}
                </ChopText>
                {shoppingItems.some(shopItem => shopItem.name.toLowerCase() === item.name.toLowerCase()) && (
                  <IconSymbol name="cart.fill" size={14} color={themeColor} />
                )}
              </View>
              {item.expirationDate && (
                <ChopText
                  size="xs"
                  variant={
                    expired ? "error" : expiringSoon ? "warning" : "muted"
                  }
                >
                  {expired
                    ? "Expired"
                    : `Expires: ${new Date(
                        item.expirationDate
                      ).toLocaleDateString()}`}
                </ChopText>
              )}
            </View>
            <ChopText size="small" variant="muted">
              {item.quantity}
            </ChopText>
          </TouchableOpacity>
          <View style={styles.dragHandleContainer}>
            <TouchableOpacity
              style={styles.dragHandle}
              onLongPress={drag}
              delayLongPress={0}
            >
              <IconSymbol
                name="line.horizontal.3"
                size={20}
                color={darkMode ? "#666" : "#999"}
              />
            </TouchableOpacity>
            {multiSelectMode &&
              isSelected &&
              selectedItems.size > 1 &&
              !isActive && (
                <View
                  style={[
                    styles.selectedBadge,
                    { backgroundColor: themeColor },
                  ]}
                >
                  <ChopText size="xs" weight="bold" color="#fff">
                    {selectedItems.size}
                  </ChopText>
                </View>
              )}
          </View>
          {/* {!multiSelectMode && (
            <TouchableOpacity
              style={styles.moveButton}
              onPress={() => handleMoveItem(item)}
            >
              <IconSymbol
                name="chevron.right"
                size={20}
                color={darkMode ? '#666' : '#999'}
              />
            </TouchableOpacity>
          )} */}
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
              Pantry List
            </ChopText>
            {multiSelectMode && (
              <View style={styles.multiSelectToolbar}>
                <ChopText size="small" variant="muted">
                  {selectedItems.size} selected
                </ChopText>
                <View style={styles.toolbarActions}>
                  <TouchableOpacity
                    onPress={handleDeleteSelected}
                    style={styles.toolbarButton}
                    disabled={selectedItems.size === 0}
                  >
                    <IconSymbol name="trash" size={20} color="#ff3b30" />
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

          {flatListData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ChopText size="medium" variant="muted" useGlobalFontSize>
                No items in your pantry
              </ChopText>
              <ChopText
                size="small"
                variant="muted"
                style={styles.emptySubtext}
              >
                Tap the + button to add items
              </ChopText>
              <ChopText
                size="xs"
                variant="muted"
                style={{ marginTop: 16, textAlign: "center" }}
              >
                Items will be automatically organized into categories!
              </ChopText>
            </View>
          ) : (
            <DraggableFlatList
              data={flatListData}
              onDragEnd={handleDragEnd}
              keyExtractor={(item, index) =>
                item.type === "category"
                  ? `cat-${item.categoryId}`
                  : `item-${item.item.id}`
              }
              renderItem={renderItem}
              containerStyle={styles.list}
            />
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
              {/* Add to Recipe Button */}
              <TouchableOpacity
                style={[styles.fabSecondary, { backgroundColor: themeColor }]}
                onPress={handleAddToRecipe}
                activeOpacity={0.8}
              >
                <IconSymbol name="book.fill" size={24} color="#fff" />
                <ChopText size="xs" weight="bold" color="#fff" style={{ marginTop: 2 }}>
                  Add to Recipe
                </ChopText>
              </TouchableOpacity>

              {/* Add to Shopping Button */}
              <TouchableOpacity
                style={[styles.fab, { backgroundColor: themeColor }]}
                onPress={handleMoveToShoppingList}
                activeOpacity={0.8}
              >
                <IconSymbol name="cart.fill" size={24} color="#fff" />
                <ChopText size="xs" weight="bold" color="#fff" style={{ marginTop: 2 }}>
                  Add to Shopping
                </ChopText>
              </TouchableOpacity>
            </>
          )}

          <AddPantryItemModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setEditItem(undefined);
            }}
            editItem={editItem}
          />

          {/* Move to Category Modal */}
          <Modal
            visible={moveCategoryModalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setMoveCategoryModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View
                style={[
                  styles.moveCategoryModal,
                  { backgroundColor: darkMode ? "#1c1c1e" : "#fff" },
                ]}
              >
                <View style={styles.modalHeader}>
                  <ChopText size="xl" weight="bold">
                    Move to Category
                  </ChopText>
                  <TouchableOpacity
                    onPress={() => setMoveCategoryModalVisible(false)}
                  >
                    <ChopText size="large" variant="muted">
                      ✕
                    </ChopText>
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={categories}
                  keyExtractor={(cat) => cat.id}
                  renderItem={({ item: category }) => (
                    <TouchableOpacity
                      style={[
                        styles.categoryOption,
                        { backgroundColor: category.color },
                        itemToMove?.category === category.id &&
                          styles.currentCategory,
                      ]}
                      onPress={() => handleMoveToCategory(category.id)}
                    >
                      <ChopText size="medium" weight="semibold" color="#333">
                        {category.name}
                      </ChopText>
                      {itemToMove?.category === category.id && (
                        <ChopText size="small" color="#666">
                          (Current)
                        </ChopText>
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>

          {/* Category Edit Modal */}
          <CategoryModal
            visible={categoryModalVisible}
            onClose={() => {
              setCategoryModalVisible(false);
              setEditingCategory(undefined);
            }}
            onSave={handleSaveCategory}
            editCategory={editingCategory}
          />

          {/* Recipe Selector Modal */}
          <RecipeSelectorModal
            visible={recipeSelectorVisible}
            onClose={() => {
              setRecipeSelectorVisible(false);
              setPreselectedIngredients([]);
            }}
            onSelectRecipe={handleSelectRecipe}
            onCreateNew={handleCreateNewRecipe}
          />

          {/* Add Recipe Modal with preselected ingredients */}
          <AddRecipeModal
            visible={addRecipeModalVisible}
            onClose={handleCloseAddRecipeModal}
            preselectedIngredients={preselectedIngredients}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
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
  categoryHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    borderRadius: 8,
  },
  categoryHeaderMain: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  categoryHeaderContent: {
    flex: 1,
  },
  categoryEditButton: {
    padding: 12,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderBottomWidth: 1,
  },
  checkbox: {
    padding: 16,
    paddingRight: 8,
  },
  dragHandleContainer: {
    position: "relative",
  },
  dragHandle: {
    padding: 16,
    paddingRight: 8,
  },
  dragHandlePlaceholder: {
    padding: 16,
    paddingRight: 8,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 50,
  },
  selectedBadge: {
    position: "absolute",
    top: 8,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  moveButton: {
    padding: 16,
    paddingLeft: 8,
  },
  itemContent: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    marginBottom: 4,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  moveCategoryModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  categoryOption: {
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  currentCategory: {
    borderWidth: 2,
    borderColor: "#666",
  },
});
