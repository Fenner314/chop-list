import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addItem,
  PantryListItem,
  updateItem,
} from "@/store/slices/pantryListSlice";
import {
  autoCategorizeItem,
  getSuggestedCategories,
} from "@/utils/categorization";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChopText } from "./chop-text";

interface AddPantryItemModalProps {
  visible: boolean;
  onClose: () => void;
  editItem?: PantryListItem;
}

export function AddPantryItemModal({
  visible,
  onClose,
  editItem,
}: AddPantryItemModalProps) {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const categories = useAppSelector((state) => state.settings.categories || []);

  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("other");
  const [expirationDate, setExpirationDate] = useState("");
  const [suggestedCategories, setSuggestedCategories] = useState<string[]>([]);

  useEffect(() => {
    if (editItem) {
      setName(editItem.name);
      setQuantity(editItem.quantity);
      setSelectedCategory(editItem.category);
      setExpirationDate(
        editItem.expirationDate
          ? new Date(editItem.expirationDate).toISOString().split("T")[0]
          : ""
      );
    } else {
      setName("");
      setQuantity("");
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
    }
  }, [name, editItem]);

  const handleSave = () => {
    console.log("handleSave activated");
    if (!name.trim()) {
      return;
    }

    const expirationTimestamp = expirationDate
      ? new Date(expirationDate).getTime()
      : undefined;

    if (editItem) {
      dispatch(
        updateItem({
          ...editItem,
          name: name.trim(),
          quantity: quantity.trim() || "1",
          category: selectedCategory,
          expirationDate: expirationTimestamp,
        })
      );
    } else {
      dispatch(
        addItem({
          name: name.trim(),
          quantity: quantity.trim() || "1",
          category: selectedCategory,
          expirationDate: expirationTimestamp,
        })
      );
    }

    onClose();
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
          <ChopText size="large" weight="semibold">
            {editItem ? "Edit Item" : "Add Item"}
          </ChopText>
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
              Quantity *
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#222" : "#f5f5f5",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={quantity}
              onChangeText={setQuantity}
              placeholder="e.g., 1 gallon, 2 dozen, 500g"
              placeholderTextColor={darkMode ? "#666" : "#999"}
            />
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
              onChangeText={setExpirationDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={darkMode ? "#666" : "#999"}
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Category {suggestedCategories.length > 0 && "(Auto-detected)"}
            </ChopText>
            <ScrollView
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

          <View style={styles.infoBox}>
            <ChopText size="xs" variant="muted">
              * Required fields
            </ChopText>
            {suggestedCategories.length > 0 && (
              <ChopText size="xs" variant="muted" style={{ marginTop: 4 }}>
                Categories are automatically suggested based on the item name
              </ChopText>
            )}
          </View>
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
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
});
