import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { ShoppingListItem, removeItem, updateItemCategory, reorderItems, toggleItemCompleted, clearCompleted, uncheckAll } from '@/store/slices/shoppingListSlice';
import { initializeCategories } from '@/store/slices/settingsSlice';
import { AnimatedCaret } from '@/components/animated-caret';
import { ChopText } from '@/components/chop-text';
import { AddShoppingItemModal } from '@/components/add-shopping-item-modal';
import { SearchInput } from '@/components/search-input';
import { IconSymbol } from '@/components/ui/icon-symbol';

// Type for list items that includes both items and category headers
type ListItem =
  | { type: 'category'; categoryId: string; title: string; color: string; itemCount: number }
  | { type: 'item'; item: ShoppingListItem; categoryId: string }
  | { type: 'completedHeader' }
  | { type: 'completedItem'; item: ShoppingListItem };

export default function ShoppingListScreen() {
  const dispatch = useAppDispatch();
  const items = useAppSelector(state => state.shoppingList.items);
  const categories = useAppSelector(state => state.settings.categories || []);
  const darkMode = useAppSelector(state => state.settings.darkMode);
  const themeColor = useAppSelector(state => state.settings.themeColor);
  const sortBy = useAppSelector(state => state.settings.shoppingListSettings.sortBy);

  const [modalVisible, setModalVisible] = useState(false);
  const [editItem, setEditItem] = useState<ShoppingListItem | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [completedExpanded, setCompletedExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Separate active and completed items
  const activeItems = useMemo(() => items.filter(item => !item.completed), [items]);
  const completedItems = useMemo(() => items.filter(item => item.completed), [items]);

  // Create flat list with category headers and items
  const flatListData = useMemo((): ListItem[] => {
    const data: ListItem[] = [];

    // Sort items within each category
    const sortItems = (itemsList: ShoppingListItem[]) => {
      switch (sortBy) {
        case 'alphabetical':
          return [...itemsList].sort((a, b) => a.name.localeCompare(b.name));
        case 'category':
          return [...itemsList].sort((a, b) => {
            if (a.category !== b.category) {
              return a.category.localeCompare(b.category);
            }
            return (a.order || 0) - (b.order || 0);
          });
        case 'manual':
        default:
          return [...itemsList].sort((a, b) => (a.order || 0) - (b.order || 0));
      }
    };

    // Filter items based on search query
    const filteredActiveItems = searchQuery.trim()
      ? activeItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : activeItems;

    const filteredCompletedItems = searchQuery.trim()
      ? completedItems.filter(item =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : completedItems;

    // Add active items grouped by category
    categories.forEach(category => {
      const categoryItems = filteredActiveItems.filter(item => item.category === category.id);
      if (categoryItems.length > 0) {
        // Add category header
        data.push({
          type: 'category',
          categoryId: category.id,
          title: category.name,
          color: category.color,
          itemCount: categoryItems.length,
        });

        // Add items if category is expanded
        if (expandedCategories.has(category.id)) {
          sortItems(categoryItems).forEach(item => {
            data.push({
              type: 'item',
              item,
              categoryId: category.id,
            });
          });
        }
      }
    });

    // Add completed items section at the bottom
    if (filteredCompletedItems.length > 0) {
      data.push({ type: 'completedHeader' });

      if (completedExpanded) {
        sortItems(filteredCompletedItems).forEach(item => {
          data.push({
            type: 'completedItem',
            item,
          });
        });
      }
    }

    return data;
  }, [activeItems, completedItems, categories, sortBy, expandedCategories, completedExpanded, searchQuery]);

  // Initialize categories if empty
  useEffect(() => {
    dispatch(initializeCategories());
  }, [dispatch]);

  // Auto-expand categories that have items
  useEffect(() => {
    const categoriesWithItems = new Set(
      categories
        .filter(cat => activeItems.some(item => item.category === cat.id))
        .map(cat => cat.id)
    );

    setExpandedCategories(prev => {
      const newExpanded = new Set(prev);

      // Add any new categories that now have items
      categoriesWithItems.forEach(catId => {
        if (!prev.has(catId)) {
          newExpanded.add(catId);
        }
      });

      // Remove categories that no longer have items
      prev.forEach(catId => {
        if (!categoriesWithItems.has(catId)) {
          newExpanded.delete(catId);
        }
      });

      return newExpanded;
    });
  }, [categories, activeItems]);

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleEditItem = (item: ShoppingListItem) => {
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

  const handleItemPress = (item: ShoppingListItem) => {
    if (multiSelectMode) {
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
      // Toggle completed status
      dispatch(toggleItemCompleted(item.id));
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Items',
      `Are you sure you want to delete ${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            selectedItems.forEach(itemId => dispatch(removeItem(itemId)));
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

  const handleSelectAll = () => {
    const allActiveItemIds = new Set(activeItems.map(item => item.id));
    setSelectedItems(allActiveItemIds);
  };

  const handleClearCompleted = () => {
    Alert.alert(
      'Delete All Completed',
      `Delete all ${completedItems.length} completed items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(clearCompleted()),
        },
      ]
    );
  };

  const handleUncheckAll = () => {
    dispatch(uncheckAll());
  };

  const handleDragEnd = useCallback(({ data, to }: { data: ListItem[]; to: number }) => {
    // Build the new item order from the dragged list
    const newItemOrder: ShoppingListItem[] = [];
    let currentCategory = '';
    let draggedItemIndex = -1;
    let targetCategory = '';
    let draggedItem: ShoppingListItem | null = null;

    // Extract all items and find where the dragged item landed
    data.forEach((listItem, index) => {
      if (listItem.type === 'category') {
        currentCategory = listItem.categoryId;
      } else if (listItem.type === 'item') {
        const item = listItem.item;

        // Find the dragged item
        if (index === to && multiSelectMode && selectedItems.has(item.id)) {
          draggedItemIndex = newItemOrder.length;
          targetCategory = currentCategory;
          draggedItem = item;
        }

        newItemOrder.push({ ...item, category: currentCategory || item.category });
      }
    });

    // If multiple items selected and we dragged one of them, move all selected together
    if (multiSelectMode && selectedItems.size > 1 && draggedItem && draggedItemIndex >= 0) {
      // Get all selected items in their current order
      const selectedArray = activeItems.filter(i => selectedItems.has(i.id));

      // Update all selected items to target category
      selectedArray.forEach(item => {
        if (item.category !== targetCategory) {
          dispatch(updateItemCategory({ id: item.id, category: targetCategory }));
        }
      });

      // Remove all selected items from new order
      const withoutSelected = newItemOrder.filter(i => !selectedItems.has(i.id));

      // Find the position where we want to insert
      let adjustedIndex = draggedItemIndex;
      for (let i = 0; i < draggedItemIndex; i++) {
        if (selectedItems.has(newItemOrder[i].id)) {
          adjustedIndex--;
        }
      }

      // Insert all selected items at target position with updated category
      const movedSelected = selectedArray.map(i => ({ ...i, category: targetCategory }));
      withoutSelected.splice(adjustedIndex, 0, ...movedSelected);

      // Add back completed items
      const allItems = [...withoutSelected, ...completedItems];
      dispatch(reorderItems(allItems));
      return;
    }

    // Single item drag - update categories if changed
    newItemOrder.forEach((item) => {
      const originalItem = activeItems.find(i => i.id === item.id);
      if (originalItem && originalItem.category !== item.category) {
        dispatch(updateItemCategory({ id: item.id, category: item.category }));
      }
    });

    // Add back completed items
    const allItems = [...newItemOrder, ...completedItems];
    dispatch(reorderItems(allItems));
  }, [dispatch, activeItems, completedItems, multiSelectMode, selectedItems]);

  const renderItem = ({ item: listItem, drag, isActive }: RenderItemParams<ListItem>) => {
    if (listItem.type === 'category') {
      const isExpanded = expandedCategories.has(listItem.categoryId);
      return (
        <View style={[styles.categoryHeader, { backgroundColor: listItem.color }]}>
          <TouchableOpacity
            style={styles.categoryHeaderMain}
            onPress={() => toggleCategory(listItem.categoryId)}
          >
            <View style={styles.categoryHeaderContent}>
              <ChopText size="medium" weight="semibold" color="#333">
                {listItem.title}
              </ChopText>
              <ChopText size="small" color="#666">
                {listItem.itemCount} {listItem.itemCount === 1 ? 'item' : 'items'}
              </ChopText>
            </View>
            <AnimatedCaret isExpanded={isExpanded} color="#333" size={24} />
          </TouchableOpacity>
        </View>
      );
    }

    if (listItem.type === 'completedHeader') {
      return (
        <View style={[styles.completedHeader, { backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5' }]}>
          <TouchableOpacity
            style={styles.completedHeaderMain}
            onPress={() => setCompletedExpanded(!completedExpanded)}
          >
            <View style={styles.completedHeaderContent}>
              <ChopText size="medium" weight="semibold">
                Completed
              </ChopText>
              <ChopText size="small" variant="muted">
                {completedItems.length} {completedItems.length === 1 ? 'item' : 'items'}
              </ChopText>
            </View>
            <AnimatedCaret isExpanded={completedExpanded} color={darkMode ? '#999' : '#666'} size={24} />
          </TouchableOpacity>
          {completedExpanded && (
            <View style={styles.completedActions}>
              <TouchableOpacity
                style={styles.completedActionButton}
                onPress={handleUncheckAll}
              >
                <IconSymbol name="arrow.uturn.backward" size={18} color={themeColor} />
                <ChopText size="small" variant="theme">Uncheck All</ChopText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.completedActionButton}
                onPress={handleClearCompleted}
              >
                <IconSymbol name="trash" size={18} color="#ff3b30" />
                <ChopText size="small" style={{ color: '#ff3b30' }}>Delete All</ChopText>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
    }

    if (listItem.type === 'completedItem') {
      const item = listItem.item;
      return (
        <TouchableOpacity
          style={[
            styles.itemContainer,
            { borderBottomColor: darkMode ? '#333' : '#eee' },
          ]}
          onPress={() => dispatch(toggleItemCompleted(item.id))}
        >
          <View style={styles.checkbox}>
            <IconSymbol
              name="checkmark.circle.fill"
              size={24}
              color={themeColor}
            />
          </View>
          <View style={styles.itemContent}>
            <ChopText size="medium" useGlobalFontSize style={styles.completedText}>
              {item.name}
            </ChopText>
            <ChopText size="small" variant="muted" style={styles.completedText}>
              {item.quantity}
            </ChopText>
          </View>
        </TouchableOpacity>
      );
    }

    // Active item rendering
    const { item } = listItem;
    const isSelected = selectedItems.has(item.id);
    const itemOpacity = multiSelectMode && isSelected && selectedItems.size > 1 && isActive ? 0.3 : 1;

    return (
      <ScaleDecorator>
        <View
          style={[
            styles.itemContainer,
            { borderBottomColor: darkMode ? '#333' : '#eee', opacity: itemOpacity },
            isSelected && !isActive && { backgroundColor: darkMode ? '#1c3a4a' : '#e3f2fd' },
            isActive && { backgroundColor: darkMode ? '#2c3e50' : '#bbdefb' },
          ]}
        >
          {multiSelectMode ? (
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
          ) : (
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => handleItemPress(item)}
            >
              <IconSymbol
                name="circle"
                size={24}
                color={darkMode ? '#666' : '#ccc'}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.itemContent}
            onPress={() => multiSelectMode ? handleItemPress(item) : handleEditItem(item)}
            onLongPress={() => handleLongPress(item.id)}
          >
            <View style={styles.itemInfo}>
              <ChopText size="medium" useGlobalFontSize style={styles.itemName}>
                {item.name}
              </ChopText>
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
          </View>
        </View>
      </ScaleDecorator>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}
        edges={['top']}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <ChopText size="xxl" weight="bold" variant="theme" style={styles.title}>
              Shopping List
            </ChopText>

            {/* Search Bar */}
            <SearchInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items..."
              darkMode={darkMode}
            />

            {multiSelectMode && (
              <View style={styles.multiSelectToolbar}>
                <ChopText size="small" variant="muted">
                  {selectedItems.size} selected
                </ChopText>
                <View style={styles.toolbarActions}>
                  <TouchableOpacity
                    onPress={handleSelectAll}
                    style={styles.toolbarButton}
                  >
                    <ChopText size="small" variant="theme">Select All</ChopText>
                  </TouchableOpacity>
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
                    <ChopText size="small" variant="theme">Cancel</ChopText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {flatListData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ChopText size="medium" variant="muted" useGlobalFontSize>
                No items in your shopping list
              </ChopText>
              <ChopText size="small" variant="muted" style={styles.emptySubtext}>
                Tap the + button to add items
              </ChopText>
            </View>
          ) : (
            <DraggableFlatList
              data={flatListData}
              onDragEnd={handleDragEnd}
              keyExtractor={(item, index) => {
                if (item.type === 'category') return `cat-${item.categoryId}`;
                if (item.type === 'completedHeader') return 'completed-header';
                if (item.type === 'completedItem') return `completed-${item.item.id}`;
                return `item-${item.item.id}`;
              }}
              renderItem={renderItem}
              containerStyle={styles.list}
            />
          )}

          {/* Floating Action Button */}
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: themeColor }]}
            onPress={handleAddNew}
            activeOpacity={0.8}
          >
            <IconSymbol name="plus" size={28} color="#fff" />
          </TouchableOpacity>

          <AddShoppingItemModal
            visible={modalVisible}
            onClose={() => {
              setModalVisible(false);
              setEditItem(undefined);
            }}
            editItem={editItem}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  toolbarActions: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  toolbarButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptySubtext: {
    marginTop: 8,
  },
  list: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 8,
  },
  categoryHeaderMain: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  categoryHeaderContent: {
    flex: 1,
  },
  completedHeader: {
    marginTop: 16,
    marginBottom: 4,
    borderRadius: 8,
  },
  completedHeaderMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  completedHeaderContent: {
    flex: 1,
  },
  completedActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  completedActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
  },
  checkbox: {
    padding: 16,
    paddingRight: 8,
  },
  dragHandleContainer: {
    position: 'relative',
  },
  dragHandle: {
    padding: 16,
    paddingRight: 8,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  itemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
});
