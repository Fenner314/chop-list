import { useAppSelector } from "@/store/hooks";
import { Recipe } from "@/store/slices/recipesSlice";
import React, { useState } from "react";
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
import { IconSymbol } from "./ui/icon-symbol";

interface RecipeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectRecipe: (recipe: Recipe) => void;
  onCreateNew: () => void;
}

export function RecipeSelectorModal({
  visible,
  onClose,
  onSelectRecipe,
  onCreateNew,
}: RecipeSelectorModalProps) {
  const recipes = useAppSelector((state) => state.recipes.recipes);
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  const [searchQuery, setSearchQuery] = useState("");

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectRecipe = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    setSearchQuery("");
  };

  const handleCreateNew = () => {
    onCreateNew();
    setSearchQuery("");
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
            Select Recipe
          </ChopText>
          <View style={{ width: 60 }} />
        </View>

        <View style={styles.content}>
          {/* Search bar */}
          <View style={styles.searchContainer}>
            <IconSymbol
              name="magnifyingglass"
              size={18}
              color={darkMode ? "#666" : "#999"}
            />
            <TextInput
              style={[
                styles.searchInput,
                {
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search recipes..."
              placeholderTextColor={darkMode ? "#666" : "#999"}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <IconSymbol
                  name="xmark.circle.fill"
                  size={18}
                  color={darkMode ? "#666" : "#999"}
                />
              </TouchableOpacity>
            )}
          </View>

          {/* Create New Recipe button */}
          <TouchableOpacity
            style={[
              styles.createNewButton,
              { backgroundColor: themeColor },
            ]}
            onPress={handleCreateNew}
          >
            <IconSymbol name="plus.circle.fill" size={24} color="#fff" />
            <ChopText size="medium" weight="semibold" color="#fff">
              Create New Recipe
            </ChopText>
          </TouchableOpacity>

          {/* Recipe list */}
          {filteredRecipes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ChopText size="medium" variant="muted">
                {searchQuery
                  ? "No recipes found"
                  : "No recipes yet"}
              </ChopText>
              {!searchQuery && (
                <ChopText size="small" variant="muted" style={{ marginTop: 8 }}>
                  Create a new recipe to get started
                </ChopText>
              )}
            </View>
          ) : (
            <ScrollView style={styles.recipeList}>
              <ChopText
                size="small"
                variant="muted"
                style={styles.sectionTitle}
              >
                SELECT EXISTING RECIPE ({filteredRecipes.length})
              </ChopText>
              {filteredRecipes.map((recipe) => (
                <TouchableOpacity
                  key={recipe.id}
                  style={[
                    styles.recipeCard,
                    { backgroundColor: darkMode ? "#1a1a1a" : "#f9f9f9" },
                  ]}
                  onPress={() => handleSelectRecipe(recipe)}
                >
                  <View style={styles.recipeCardHeader}>
                    <ChopText size="medium" weight="semibold">
                      {recipe.name}
                    </ChopText>
                    <IconSymbol
                      name="chevron.right"
                      size={20}
                      color={darkMode ? "#666" : "#999"}
                    />
                  </View>
                  {recipe.description && (
                    <ChopText
                      size="small"
                      variant="muted"
                      style={styles.recipeDescription}
                      numberOfLines={2}
                    >
                      {recipe.description}
                    </ChopText>
                  )}
                  <View style={styles.recipeCardFooter}>
                    <View style={styles.recipeMetadata}>
                      <IconSymbol
                        name="list.bullet"
                        size={14}
                        color={darkMode ? "#666" : "#999"}
                      />
                      <ChopText size="xs" variant="muted">
                        {recipe.ingredients.length} ingredient
                        {recipe.ingredients.length !== 1 ? "s" : ""}
                      </ChopText>
                    </View>
                    <View style={styles.recipeMetadata}>
                      <IconSymbol
                        name="person.2"
                        size={14}
                        color={darkMode ? "#666" : "#999"}
                      />
                      <ChopText size="xs" variant="muted">
                        {recipe.servings} serving
                        {recipe.servings !== 1 ? "s" : ""}
                      </ChopText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  createNewButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  recipeList: {
    flex: 1,
  },
  recipeCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  recipeCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeDescription: {
    marginBottom: 12,
    lineHeight: 18,
  },
  recipeCardFooter: {
    flexDirection: "row",
    gap: 16,
  },
  recipeMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
