import { AnimatedCaret } from "@/components/animated-caret";
import { CategoryModal } from "@/components/category-modal";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCategory,
  Category,
  deleteCategory,
  setDarkMode,
  setFontSize,
  setThemeColor,
  updateCategory,
  updateRecipesSettings,
  updateShoppingListSettings,
  updatePantryListSettings,
} from "@/store/slices/settingsSlice";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.settings);
  const { themeColor, fontSize, darkMode, categories } = settings;

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [shoppingListExpanded, setShoppingListExpanded] = useState(false);
  const [pantryListExpanded, setPantryListExpanded] = useState(false);
  const [recipesExpanded, setRecipesExpanded] = useState(false);

  const fontSizeValue =
    fontSize === "small" ? 14 : fontSize === "large" ? 20 : 16;

  const toggleCategoriesExpanded = () => {
    setCategoriesExpanded(!categoriesExpanded);
  };

  const themeColors = [
    { name: "Blue", value: "#007AFF" },
    { name: "Green", value: "#34C759" },
    { name: "Red", value: "#FF3B30" },
    { name: "Orange", value: "#FF9500" },
    { name: "Purple", value: "#AF52DE" },
    { name: "Pink", value: "#FF2D55" },
  ];

  const handleAddCategory = () => {
    setEditingCategory(undefined);
    setCategoryModalVisible(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryModalVisible(true);
  };

  const handleDeleteCategory = (category: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"? Items in this category will be moved to "Other".`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => dispatch(deleteCategory(category.id)),
        },
      ]
    );
  };

  const handleSaveCategory = (categoryData: {
    name: string;
    color: string;
    icon?: string;
  }) => {
    if (editingCategory) {
      dispatch(updateCategory({ ...editingCategory, ...categoryData }));
    } else {
      dispatch(addCategory(categoryData));
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
      edges={["top"]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView style={styles.content}>
          <Text
            style={[
              styles.mainTitle,
              { fontSize: fontSizeValue + 8, color: themeColor },
            ]}
          >
            Settings
          </Text>

          <View
            style={[
              styles.section,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: fontSizeValue + 2,
                  color: darkMode ? "#fff" : "#333",
                },
              ]}
            >
              General Settings
            </Text>

            <View style={styles.settingItem}>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Dark Mode
              </Text>
              <Switch
                value={darkMode}
                onValueChange={(value) => dispatch(setDarkMode(value))}
                trackColor={{ false: "#767577", true: themeColor }}
              />
            </View>

            <View style={styles.settingItem}>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Theme Color
              </Text>
            </View>
            <View style={styles.colorPickerContainer}>
              {themeColors.map((color) => (
                <TouchableOpacity
                  key={color.value}
                  style={[
                    styles.colorButton,
                    { backgroundColor: color.value },
                    themeColor === color.value && {
                      borderColor: darkMode ? "#fff" : "#000",
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => dispatch(setThemeColor(color.value))}
                >
                  {themeColor === color.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.settingItem}>
              <Text
                style={[
                  styles.settingLabel,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Font Size
              </Text>
            </View>
            <View style={styles.fontSizeContainer}>
              {(["small", "medium", "large"] as const).map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.fontSizeButton,
                    { backgroundColor: darkMode ? "#222" : "#f0f0f0" },
                    fontSize === size && { backgroundColor: themeColor },
                  ]}
                  onPress={() => dispatch(setFontSize(size))}
                >
                  <Text
                    style={[
                      styles.fontSizeText,
                      {
                        fontSize: fontSizeValue - 2,
                        color: darkMode ? "#fff" : "#333",
                      },
                      fontSize === size && styles.selectedFontSizeText,
                    ]}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View
            style={[
              styles.section,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <TouchableOpacity
              style={styles.collapsibleSectionHeader}
              onPress={toggleCategoriesExpanded}
            >
              <Text
                style={[
                  styles.categoriesTitle,
                  {
                    fontSize: fontSizeValue + 2,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Categories ({categories.length})
              </Text>
              <View style={styles.sectionHeaderActions}>
                {categoriesExpanded && (
                  <TouchableOpacity
                    onPress={handleAddCategory}
                    style={styles.addButton}
                  >
                    <IconSymbol name="plus" size={20} color={themeColor} />
                  </TouchableOpacity>
                )}
                <AnimatedCaret
                  isExpanded={categoriesExpanded}
                  color={darkMode ? "#666" : "#999"}
                  size={24}
                />
              </View>
            </TouchableOpacity>

            {categoriesExpanded && (
              <View style={styles.categoryList}>
                {categories.map((category) => (
                  <View
                    key={category.id}
                    style={[
                      styles.categoryItem,
                      { backgroundColor: category.color },
                    ]}
                  >
                    <Text
                      style={[styles.categoryName, { fontSize: fontSizeValue }]}
                    >
                      {category.name}
                    </Text>
                    <View style={styles.categoryActions}>
                      <TouchableOpacity
                        onPress={() => handleEditCategory(category)}
                        style={styles.categoryActionButton}
                      >
                        <IconSymbol name="pencil" size={16} color="#666" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteCategory(category)}
                        style={styles.categoryActionButton}
                      >
                        <IconSymbol name="trash" size={16} color="#ff3b30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View
            style={[
              styles.section,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: fontSizeValue + 2,
                  color: darkMode ? "#fff" : "#333",
                },
              ]}
            >
              Feature Settings
            </Text>

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setShoppingListExpanded(!shoppingListExpanded)}
            >
              <Text
                style={[
                  styles.settingButtonText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Shopping List Settings
              </Text>
              <AnimatedCaret
                isExpanded={shoppingListExpanded}
                color={darkMode ? "#666" : "#999"}
                size={24}
              />
            </TouchableOpacity>

            {shoppingListExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          fontSize: fontSizeValue,
                          color: darkMode ? "#fff" : "#333",
                        },
                      ]}
                    >
                      Add Completed Items to Pantry
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          fontSize: fontSizeValue - 2,
                          color: darkMode ? "#999" : "#666",
                        },
                      ]}
                    >
                      Automatically add shopping list quantities to pantry when
                      marked complete
                    </Text>
                  </View>
                  <Switch
                    value={settings.shoppingListSettings.addCompletedToPantry}
                    onValueChange={(value) =>
                      dispatch(
                        updateShoppingListSettings({
                          addCompletedToPantry: value,
                        })
                      )
                    }
                    trackColor={{ false: "#767577", true: themeColor }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setPantryListExpanded(!pantryListExpanded)}
            >
              <Text
                style={[
                  styles.settingButtonText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Pantry List Settings
              </Text>
              <AnimatedCaret
                isExpanded={pantryListExpanded}
                color={darkMode ? "#666" : "#999"}
                size={24}
              />
            </TouchableOpacity>

            {pantryListExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.settingRow}>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          fontSize: fontSizeValue,
                          color: darkMode ? "#fff" : "#333",
                        },
                      ]}
                    >
                      Show Empty Categories
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          fontSize: fontSizeValue - 2,
                          color: darkMode ? "#999" : "#666",
                        },
                      ]}
                    >
                      Display all categories even when they contain no items
                    </Text>
                  </View>
                  <Switch
                    value={settings.pantryListSettings.showEmptyCategories}
                    onValueChange={(value) => {
                      dispatch(
                        updatePantryListSettings({ showEmptyCategories: value })
                      );
                    }}
                    trackColor={{ false: "#767577", true: themeColor }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setRecipesExpanded(!recipesExpanded)}
            >
              <Text
                style={[
                  styles.settingButtonText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Recipes Settings
              </Text>
              <AnimatedCaret
                isExpanded={recipesExpanded}
                color={darkMode ? "#666" : "#999"}
                size={24}
              />
            </TouchableOpacity>

            {recipesExpanded && (
              <View style={styles.expandedContent}>
                <View style={styles.settingRow}>
                  <Text
                    style={[
                      styles.settingLabel,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                  >
                    Default Servings
                  </Text>
                  <TextInput
                    style={[
                      styles.numberInput,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                        backgroundColor: darkMode ? "#222" : "#f5f5f5",
                        borderColor: darkMode ? "#444" : "#ddd",
                      },
                    ]}
                    defaultValue={settings.recipesSettings.defaultServings.toString()}
                    onEndEditing={(e) => {
                      const num = parseInt(e.nativeEvent.text);
                      if (!isNaN(num) && num > 0) {
                        dispatch(
                          updateRecipesSettings({ defaultServings: num })
                        );
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
              </View>
            )}
          </View>

          <View
            style={[
              styles.section,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <Text
              style={[
                styles.sectionTitle,
                {
                  fontSize: fontSizeValue + 2,
                  color: darkMode ? "#fff" : "#333",
                },
              ]}
            >
              Account
            </Text>

            <TouchableOpacity style={styles.settingButton}>
              <Text
                style={[
                  styles.settingButtonText,
                  {
                    fontSize: fontSizeValue,
                    color: darkMode ? "#fff" : "#333",
                  },
                ]}
              >
                Account Settings
              </Text>
              <AnimatedCaret
                isExpanded={false} // TODO: implement expansion
                color={darkMode ? "#666" : "#999"}
                size={24}
              />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.section,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
            <Text
              style={[
                styles.versionText,
                {
                  fontSize: fontSizeValue - 4,
                  color: darkMode ? "#666" : "#999",
                },
              ]}
            >
              Version 1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CategoryModal
        visible={categoryModalVisible}
        onClose={() => {
          setCategoryModalVisible(false);
          setEditingCategory(undefined);
        }}
        onSave={handleSaveCategory}
        editCategory={editingCategory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  mainTitle: {
    fontWeight: "bold",
    padding: 20,
    paddingBottom: 10,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  categoriesTitle: {
    fontWeight: "600",
  },
  sectionTitle: {
    fontWeight: "600",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLabel: {},
  settingDescription: {
    marginTop: 4,
  },
  colorPickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  colorButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  checkmark: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  fontSizeContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  fontSizeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  fontSizeText: {
    fontWeight: "500",
  },
  selectedFontSizeText: {
    color: "#fff",
  },
  settingButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingButtonText: {},
  arrow: {
    fontSize: 24,
  },
  versionText: {
    textAlign: "center",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  collapsibleSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  sectionHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  addButton: {
    padding: 4,
  },
  categoryList: {
    gap: 8,
    marginTop: 16,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  categoryName: {
    fontWeight: "500",
    color: "#333",
  },
  categoryActions: {
    flexDirection: "row",
    gap: 12,
  },
  categoryActionButton: {
    padding: 4,
  },
  expandedContent: {
    paddingTop: 12,
    paddingLeft: 24,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  numberInput: {
    width: 60,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },
});
