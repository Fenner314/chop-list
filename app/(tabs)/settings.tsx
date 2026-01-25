import { AnimatedCaret } from "@/components/animated-caret";
import { CategoryModal } from "@/components/category-modal";
import { PendingInvitesModal } from "@/components/sharing/PendingInvitesModal";
import { SpaceSwitcher } from "@/components/sharing/SpaceSwitcher";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useAuth } from "@/contexts/AuthContext";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addCategory,
  Category,
  deleteCategory,
  setDarkMode,
  setFontSize,
  setThemeColor,
  updateCategory,
  updatePantryListSettings,
  updateRecipesSettings,
  updateShoppingListSettings,
} from "@/store/slices/settingsSlice";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
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

// Supported sections for deep linking
export type SettingsSection =
  | "categories"
  | "shoppingList"
  | "pantryList"
  | "recipes"
  | "account";
// Supported focus fields for deep linking
export type SettingsFocusField = "geminiApiKey";

export default function SettingsScreen() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, isAuthenticated, signOut } = useAuth();
  const settings = useAppSelector((state) => state.settings);
  const { themeColor, fontSize, darkMode, categories } = settings;

  // Deep linking params for auto-expanding sections and focusing fields
  const { expandSection, focusField } = useLocalSearchParams<{
    expandSection?: SettingsSection;
    focusField?: SettingsFocusField;
  }>();

  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<
    Category | undefined
  >();
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [shoppingListExpanded, setShoppingListExpanded] = useState(false);
  const [pantryListExpanded, setPantryListExpanded] = useState(false);
  const [recipesExpanded, setRecipesExpanded] = useState(false);
  const [accountExpanded, setAccountExpanded] = useState(false);
  const [invitesModalVisible, setInvitesModalVisible] = useState(false);

  // API key input state
  const [newApiKey, setNewApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const hasApiKey = Boolean(settings.recipesSettings.geminiApiKey?.trim());

  // Refs for focusable inputs
  const geminiApiKeyRef = useRef<TextInput>(null);

  // Handle deep linking to expand sections and focus fields
  useEffect(() => {
    if (expandSection) {
      switch (expandSection) {
        case "categories":
          setCategoriesExpanded(true);
          break;
        case "shoppingList":
          setShoppingListExpanded(true);
          break;
        case "pantryList":
          setPantryListExpanded(true);
          break;
        case "recipes":
          setRecipesExpanded(true);
          break;
        case "account":
          setAccountExpanded(true);
          break;
      }
    }

    // Focus the specified field after a short delay to allow section to expand
    if (focusField) {
      const timer = setTimeout(() => {
        switch (focusField) {
          case "geminiApiKey":
            geminiApiKeyRef.current?.focus();
            break;
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [expandSection, focusField]);

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
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
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
                <View
                  style={[
                    styles.settingRow,
                    {
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: 8,
                    },
                  ]}
                >
                  <View>
                    <Text
                      style={[
                        styles.settingLabel,
                        {
                          fontSize: fontSizeValue,
                          color: darkMode ? "#fff" : "#333",
                        },
                      ]}
                    >
                      Gemini API Key
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
                      Required for recipe scanning. Get a free key at{" "}
                      <Text
                        style={{
                          color: themeColor,
                          textDecorationLine: "underline",
                        }}
                        onPress={() =>
                          Linking.openURL("https://aistudio.google.com/apikey")
                        }
                      >
                        aistudio.google.com
                      </Text>
                    </Text>
                  </View>
                  {hasApiKey ? (
                    // Display saved API key (read-only)
                    <View style={styles.apiKeyDisplayRow}>
                      <View
                        style={[
                          styles.apiKeyDisplayContainer,
                          {
                            backgroundColor: darkMode ? "#222" : "#f5f5f5",
                            borderColor: darkMode ? "#444" : "#ddd",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.apiKeyText,
                            {
                              fontSize: fontSizeValue,
                              color: darkMode ? "#fff" : "#333",
                            },
                          ]}
                          numberOfLines={1}
                        >
                          ••••••••••••••••••••••••••••••••
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.apiKeyDeleteButton,
                          { backgroundColor: darkMode ? "#331111" : "#ffeeee" },
                        ]}
                        onPress={() => {
                          Alert.alert(
                            "Delete API Key",
                            "Are you sure you want to delete your Gemini API key?",
                            [
                              { text: "Cancel", style: "cancel" },
                              {
                                text: "Delete",
                                style: "destructive",
                                onPress: () => {
                                  dispatch(
                                    updateRecipesSettings({ geminiApiKey: "" })
                                  );
                                  setShowApiKey(false);
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <IconSymbol name="trash" size={18} color="#ff3b30" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // Input for adding new API key
                    <View style={styles.apiKeyInputColumn}>
                      <View
                        style={[
                          styles.apiKeyInputContainer,
                          {
                            backgroundColor: darkMode ? "#222" : "#f5f5f5",
                            borderColor: darkMode ? "#444" : "#ddd",
                          },
                        ]}
                      >
                        <TextInput
                          ref={geminiApiKeyRef}
                          style={[
                            styles.apiKeyInput,
                            {
                              fontSize: fontSizeValue,
                              color: darkMode ? "#fff" : "#333",
                            },
                          ]}
                          value={newApiKey}
                          onChangeText={setNewApiKey}
                          placeholder="Enter your Gemini API key"
                          placeholderTextColor={darkMode ? "#666" : "#999"}
                          secureTextEntry={!showApiKey}
                          autoCapitalize="none"
                          autoCorrect={false}
                          submitBehavior="submit"
                        />
                        <TouchableOpacity
                          style={styles.apiKeyInlineButton}
                          onPress={() => setShowApiKey(!showApiKey)}
                        >
                          <IconSymbol
                            name={showApiKey ? "eye.slash" : "eye"}
                            size={20}
                            color={darkMode ? "#999" : "#666"}
                          />
                        </TouchableOpacity>
                      </View>
                      <TouchableOpacity
                        style={[
                          styles.apiKeySaveButton,
                          {
                            backgroundColor: newApiKey.trim()
                              ? themeColor
                              : darkMode
                              ? "#333"
                              : "#e5e5e5",
                          },
                        ]}
                        onPress={() => {
                          if (newApiKey.trim()) {
                            dispatch(
                              updateRecipesSettings({
                                geminiApiKey: newApiKey.trim(),
                              })
                            );
                            setNewApiKey("");
                            setShowApiKey(false);
                          }
                        }}
                        disabled={!newApiKey.trim()}
                      >
                        <IconSymbol
                          name="checkmark"
                          size={18}
                          color={
                            newApiKey.trim()
                              ? "#fff"
                              : darkMode
                              ? "#666"
                              : "#999"
                          }
                        />
                        <Text
                          style={[
                            styles.apiKeySaveButtonText,
                            {
                              color: newApiKey.trim()
                                ? "#fff"
                                : darkMode
                                ? "#666"
                                : "#999",
                            },
                          ]}
                        >
                          Save API Key
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
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
              Sharing & Sync
            </Text>

            <SpaceSwitcher
              onInvitesPress={() => setInvitesModalVisible(true)}
              onSignInPress={() => setAccountExpanded(true)}
            />
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

            <TouchableOpacity
              style={styles.settingButton}
              onPress={() => setAccountExpanded(!accountExpanded)}
            >
              <View style={styles.accountInfo}>
                <IconSymbol
                  name={
                    isAuthenticated ? "person.circle.fill" : "person.circle"
                  }
                  size={24}
                  color={themeColor}
                />
                <View style={styles.accountText}>
                  <Text
                    style={[
                      styles.settingButtonText,
                      {
                        fontSize: fontSizeValue,
                        color: darkMode ? "#fff" : "#333",
                      },
                    ]}
                  >
                    {isAuthenticated
                      ? user?.displayName || "Signed In"
                      : "Not Signed In"}
                  </Text>
                  {isAuthenticated && user?.email && (
                    <Text
                      style={[
                        styles.accountEmail,
                        {
                          fontSize: fontSizeValue - 2,
                          color: darkMode ? "#666" : "#999",
                        },
                      ]}
                    >
                      {user.email}
                    </Text>
                  )}
                </View>
              </View>
              <AnimatedCaret
                isExpanded={accountExpanded}
                color={darkMode ? "#666" : "#999"}
                size={24}
              />
            </TouchableOpacity>

            {accountExpanded && (
              <View style={styles.expandedContent}>
                {isAuthenticated ? (
                  <TouchableOpacity
                    style={[
                      styles.signOutButton,
                      { backgroundColor: darkMode ? "#331111" : "#ffeeee" },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "Sign Out",
                        "Are you sure you want to sign out?",
                        [
                          { text: "Cancel", style: "cancel" },
                          {
                            text: "Sign Out",
                            style: "destructive",
                            onPress: async () => {
                              await signOut();
                            },
                          },
                        ]
                      );
                    }}
                  >
                    <IconSymbol
                      name="rectangle.portrait.and.arrow.right"
                      size={20}
                      color="#ff3b30"
                    />
                    <Text
                      style={[styles.signOutText, { fontSize: fontSizeValue }]}
                    >
                      Sign Out
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[
                      styles.signInButton,
                      { backgroundColor: themeColor },
                    ]}
                    onPress={() => router.push("/(auth)/login")}
                  >
                    <IconSymbol
                      name="person.badge.plus"
                      size={20}
                      color="#fff"
                    />
                    <Text
                      style={[styles.signInText, { fontSize: fontSizeValue }]}
                    >
                      Sign In or Create Account
                    </Text>
                  </TouchableOpacity>
                )}
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

      <PendingInvitesModal
        visible={invitesModalVisible}
        onClose={() => setInvitesModalVisible(false)}
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
  apiKeyDisplayRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: "100%",
  },
  apiKeyDisplayContainer: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  apiKeyText: {
    flex: 1,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  apiKeyInlineButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  apiKeyDeleteButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  apiKeyInputColumn: {
    width: "100%",
    gap: 12,
  },
  apiKeyInputContainer: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  apiKeyInput: {
    flex: 1,
    height: 44,
  },
  apiKeySaveButton: {
    height: 44,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  apiKeySaveButtonText: {
    fontWeight: "600",
  },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accountText: {},
  accountEmail: {},
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  signOutText: {
    color: "#ff3b30",
    fontWeight: "500",
  },
  signInButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  signInText: {
    color: "#fff",
    fontWeight: "600",
  },
});
