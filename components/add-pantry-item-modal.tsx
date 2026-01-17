import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Item,
  addItemToList,
  updateItem,
  updatePantryMetadata,
} from "@/store/slices/itemsSlice";
import { updatePantryListSettings } from "@/store/slices/settingsSlice";
import {
  autoCategorizeItem,
  getSuggestedCategories,
} from "@/utils/categorization";
import { ALL_UNITS } from "@/utils/unitConversion";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import RNPickerSelect from "react-native-picker-select";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChopText } from "./chop-text";
import { IconSymbol } from "./ui/icon-symbol";

interface AddPantryItemModalProps {
  visible: boolean;
  onClose: () => void;
  editItem?: Item;
}

export function AddPantryItemModal({
  visible,
  onClose,
  editItem,
}: AddPantryItemModalProps) {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const categories = useAppSelector((state) => state.settings.categories || []);
  const addAnotherItem = useAppSelector(
    (state) => state.settings.pantryListSettings.addAnotherItem
  );
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [expirationDate, setExpirationDate] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);
  const categoryScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(editItem.lists.pantry?.quantity || editItem.quantity);
      setUnit(editItem.lists.pantry?.unit !== undefined ? editItem.lists.pantry.unit : (editItem.unit || ""));
      setSelectedCategory(editItem.category);
      setExpirationDate(
        editItem.lists.pantry?.expirationDate
          ? new Date(editItem.lists.pantry.expirationDate)
              .toISOString()
              .split("T")[0]
          : ""
      );
    } else {
      setName("");
      setQuantity("");
      setUnit("");
      setSelectedCategory("other");
      setExpirationDate("");
      setSuggestedCategories([]);
    }
  }, [editItem, visible]);

  useEffect(() => {
    if (name.trim() && !editItem) {
      const autoCategory = autoCategorizeItem(name);
      setSelectedCategory(autoCategory);
      const suggestions = getSuggestedCategories(name);
      setSuggestedCategories(suggestions);

      // Only scroll if we actually detected a category (not just "other")
      if (autoCategory !== "other" && suggestions.length > 0) {
        setTimeout(() => {
          const categoryIndex = categories.findIndex(
            (cat) => cat.id === autoCategory
          );
          if (categoryIndex !== -1 && categoryScrollRef.current) {
            // Scroll to make the category visible on the left
            // Each category chip is approximately 100px wide with margins
            categoryScrollRef.current.scrollTo({
              x: categoryIndex * 100,
              animated: true,
            });
          }
        }, 100);
      }
    } else if (editItem) {
      // Clear suggestions when editing
      setSuggestedCategories([]);
    }
  }, [name, editItem, categories]);

  const handleSave = () => {
    console.log("handleSave activated");
    if (!name.trim()) {
      return;
    }

    const expirationTimestamp = expirationDate
      ? new Date(expirationDate).getTime()
      : undefined;

    if (editItem) {
      // Update pantry list item properties
      dispatch(
        updateItem({
          itemId: editItem.id,
          name: name.trim(),
          quantity: quantity.trim() || "1",
          unit: unit,
          category: selectedCategory,
          listType: "pantry",
        })
      );

      // Update pantry-specific metadata
      dispatch(
        updatePantryMetadata({
          itemId: editItem.id,
          metadata: {
            expirationDate: expirationTimestamp,
          },
        })
      );

      onClose();
    } else {
      dispatch(
        addItemToList({
          listType: "pantry",
          name: name.trim(),
          quantity: quantity.trim() || "1",
          unit: unit || undefined,
          category: selectedCategory,
          expirationDate: expirationTimestamp,
        })
      );

      // If "add another" is checked, clear fields and keep modal open
      if (addAnotherItem) {
        setName("");
        setQuantity("");
        setExpirationDate("");
        setSuggestedCategories([]);
        // Keep the category as "other" for next item
        setSelectedCategory("other");
      } else {
        onClose();
      }
    }
  };

  const toggleAddAnotherItem = () => {
    dispatch(updatePantryListSettings({ addAnotherItem: !addAnotherItem }));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.name || "Other";
  };

  const getCategoryColor = (categoryId: string) => {
    return categories.find((cat) => cat.id === categoryId)?.color || "#E0E0E0";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: darkMode ? "#000" : "#fff" },
        ]}
        edges={["top", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <ChopText variant="theme" size="large">
              Cancel
            </ChopText>
          </TouchableOpacity>
          <View style={styles.center}>
            <ChopText size="large" weight="semibold">
              {editItem ? "Edit Item" : "Add Item"}
            </ChopText>
            <ChopText size="small" weight="semibold">
              Pantry List
            </ChopText>
          </View>
          <TouchableOpacity onPress={handleSave}>
            <ChopText variant="theme" size="large" weight="semibold">
              {editItem ? "Update" : "Add"}
            </ChopText>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Item Name *
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#222" : "#f5f5f5",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Milk, Eggs, Bread"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Quantity & Unit
            </ChopText>
            <View style={styles.quantityRow}>
              <TextInput
                style={[
                  styles.input,
                  styles.quantityInput,
                  {
                    backgroundColor: darkMode ? "#222" : "#f5f5f5",
                    color: darkMode ? "#fff" : "#000",
                  },
                ]}
                value={quantity}
                onChangeText={setQuantity}
                placeholder="1"
                placeholderTextColor={darkMode ? "#666" : "#999"}
                keyboardType="decimal-pad"
              />
              <View
                style={[
                  styles.pickerContainer,
                  { backgroundColor: darkMode ? "#222" : "#f5f5f5" },
                ]}
              >
                <RNPickerSelect
                  value={unit || ""}
                  onValueChange={(value) => setUnit(value || "")}
                  items={[
                    { label: "(no unit)", value: "" },
                    ...ALL_UNITS.map((unitOption) => ({
                      label: unitOption.label,
                      value: unitOption.value,
                    })),
                  ]}
                  style={{
                    inputIOS: {
                      ...styles.picker,
                      color: darkMode ? "#fff" : "#000",
                    },
                    inputAndroid: {
                      ...styles.picker,
                      color: darkMode ? "#fff" : "#000",
                    },
                  }}
                  placeholder={{}}
                  useNativeAndroidPickerStyle={false}
                />
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Expiration Date (Optional)
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#222" : "#f5f5f5",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={expirationDate}
              onChangeText={(text) => {
                // Remove all non-digit characters
                const cleaned = text.replace(/\D/g, "");

                // Format as YYYY-MM-DD
                let formatted = cleaned;
                if (cleaned.length > 4) {
                  formatted = cleaned.slice(0, 4) + "-" + cleaned.slice(4);
                }
                if (cleaned.length > 6) {
                  formatted =
                    cleaned.slice(0, 4) +
                    "-" +
                    cleaned.slice(4, 6) +
                    "-" +
                    cleaned.slice(6, 8);
                }

                setExpirationDate(formatted);
              }}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              keyboardType="number-pad"
              maxLength={10}
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Category {suggestedCategories.length > 0 && "(Auto-detected)"}
            </ChopText>
            <ScrollView
              ref={categoryScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoryScroll}
            >
              {categories.map((category) => {
                const isSelected = selectedCategory === category.id;
                const isSuggested = suggestedCategories.includes(category.id);

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: category.color },
                      isSelected && styles.selectedChip,
                      isSuggested && !isSelected && styles.suggestedChip,
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <ChopText
                      size="small"
                      weight={isSelected ? "bold" : "normal"}
                      style={styles.categoryChipText}
                    >
                      {category.name}
                    </ChopText>
                    {isSuggested && !isSelected && (
                      <ChopText size="xs" style={styles.suggestionBadge}>
                        suggested
                      </ChopText>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View>
            <ChopText size="xs" variant="muted">
              * Required fields
            </ChopText>
            {suggestedCategories.length > 0 && (
              <ChopText size="xs" variant="muted" style={{ marginTop: 4 }}>
                Categories are automatically suggested based on the item name
              </ChopText>
            )}
          </View>

          {!editItem && (
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={toggleAddAnotherItem}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: darkMode ? "#666" : "#ccc",
                    backgroundColor: addAnotherItem
                      ? themeColor
                      : "transparent",
                  },
                ]}
              >
                {addAnotherItem && (
                  <IconSymbol name="checkmark" size={18} color="#fff" />
                )}
              </View>
              <ChopText size="small">Add another item</ChopText>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  center: { alignItems: "center" },
  content: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  quantityRow: {
    flexDirection: "row",
    gap: 8,
  },
  quantityInput: {
    flex: 1,
  },
  pickerContainer: {
    flex: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 48,
    paddingLeft: 12,
  },
  categoryScroll: {
    marginTop: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedChip: {
    borderColor: "#007AFF",
    borderWidth: 3,
  },
  suggestedChip: {
    borderColor: "#34C759",
    borderWidth: 2,
    borderStyle: "dashed",
  },
  categoryChipText: {
    color: "#333",
  },
  suggestionBadge: {
    color: "#34C759",
    marginTop: 2,
    fontStyle: "italic",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingVertical: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
