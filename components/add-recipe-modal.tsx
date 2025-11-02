import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  addRecipe,
  Recipe,
  RecipeIngredient,
  updateRecipe,
} from "@/store/slices/recipesSlice";
import { subtractRecipeFromPantry } from "@/store/slices/itemsSlice";
import { selectPantryItems } from "@/store/selectors/itemsSelectors";
import {
  autoCategorizeItem,
} from "@/utils/categorization";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChopText } from "./chop-text";
import { IconSymbol } from "./ui/icon-symbol";

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  editRecipe?: Recipe;
  preselectedIngredients?: Array<{ name: string; quantity: string; category: string }>;
}

export function AddRecipeModal({
  visible,
  onClose,
  editRecipe,
  preselectedIngredients,
}: AddRecipeModalProps) {
  const dispatch = useAppDispatch();
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const pantryItems = useAppSelector(selectPantryItems);
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("4");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
  const [showPantrySelector, setShowPantrySelector] = useState(false);
  const [selectedPantryItems, setSelectedPantryItems] = useState<Set<string>>(new Set());

  // New ingredient form
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");

  useEffect(() => {
    if (editRecipe) {
      setName(editRecipe.name);
      setDescription(editRecipe.description || "");
      setServings(editRecipe.servings.toString());
      setIngredients([...editRecipe.ingredients]);
    } else {
      setName("");
      setDescription("");
      setServings("4");

      // If preselected ingredients are provided, add them
      if (preselectedIngredients && preselectedIngredients.length > 0) {
        const preselected: RecipeIngredient[] = preselectedIngredients.map(item => ({
          id: `${Date.now()}-${Math.random()}`,
          name: item.name,
          quantity: item.quantity,
          category: item.category,
        }));
        setIngredients(preselected);
      } else {
        setIngredients([]);
      }
    }
    setShowPantrySelector(false);
    setSelectedPantryItems(new Set());
    setNewIngredientName("");
    setNewIngredientQuantity("");
  }, [editRecipe, visible, preselectedIngredients]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a recipe name");
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert("Error", "Please add at least one ingredient");
      return;
    }

    const servingsNum = parseInt(servings) || 4;

    if (editRecipe) {
      dispatch(
        updateRecipe({
          ...editRecipe,
          name: name.trim(),
          description: description.trim(),
          servings: servingsNum,
          ingredients,
        })
      );
    } else {
      dispatch(
        addRecipe({
          name: name.trim(),
          description: description.trim(),
          servings: servingsNum,
          ingredients,
        })
      );
    }

    onClose();
  };

  const handleCookRecipe = () => {
    if (!editRecipe) return;

    // Check which ingredients are available in pantry
    const availableIngredients: RecipeIngredient[] = [];
    const missingIngredients: RecipeIngredient[] = [];
    const insufficientIngredients: Array<{ ingredient: RecipeIngredient; available: number; needed: number }> = [];

    editRecipe.ingredients.forEach((ingredient) => {
      const pantryItem = pantryItems.find(
        (item) => item.name.toLowerCase() === ingredient.name.toLowerCase()
      );

      if (!pantryItem) {
        missingIngredients.push(ingredient);
      } else {
        const availableQty = parseFloat(pantryItem.quantity) || 0;
        const neededQty = parseFloat(ingredient.quantity) || 0;

        if (availableQty < neededQty) {
          insufficientIngredients.push({
            ingredient,
            available: availableQty,
            needed: neededQty,
          });
        } else {
          availableIngredients.push(ingredient);
        }
      }
    });

    // Show warnings if any ingredients are missing or insufficient
    if (missingIngredients.length > 0 || insufficientIngredients.length > 0) {
      let message = "";

      if (missingIngredients.length > 0) {
        message += `Missing from pantry:\n${missingIngredients.map((i) => `• ${i.name}`).join("\n")}`;
      }

      if (insufficientIngredients.length > 0) {
        if (message) message += "\n\n";
        message += `Insufficient quantity:\n${insufficientIngredients
          .map((i) => `• ${i.ingredient.name}: have ${i.available}, need ${i.needed}`)
          .join("\n")}`;
      }

      if (availableIngredients.length > 0) {
        message += "\n\nDo you want to subtract the available ingredients anyway?";
      } else {
        message += "\n\nNo ingredients can be subtracted.";
        Alert.alert("Cannot Cook Recipe", message, [{ text: "OK" }]);
        return;
      }

      Alert.alert("Some Ingredients Unavailable", message, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Subtract Available",
          onPress: () => {
            dispatch(subtractRecipeFromPantry({ ingredients: availableIngredients }));
            Alert.alert(
              "Recipe Cooked",
              `Subtracted ${availableIngredients.length} ingredient${
                availableIngredients.length !== 1 ? "s" : ""
              } from pantry.`,
              [{ text: "OK" }]
            );
            onClose();
          },
        },
      ]);
    } else {
      // All ingredients available
      Alert.alert(
        "Cook Recipe",
        `This will subtract all ingredients from your pantry. Continue?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Cook",
            onPress: () => {
              dispatch(subtractRecipeFromPantry({ ingredients: editRecipe.ingredients }));
              Alert.alert(
                "Recipe Cooked!",
                `All ingredients subtracted from pantry. Enjoy your ${editRecipe.name}!`,
                [{ text: "OK" }]
              );
              onClose();
            },
          },
        ]
      );
    }
  };

  const handleAddManualIngredient = () => {
    if (!newIngredientName.trim()) {
      return;
    }

    const category = autoCategorizeItem(newIngredientName);

    const newIngredient: RecipeIngredient = {
      id: `${Date.now()}-${Math.random()}`,
      name: newIngredientName.trim(),
      quantity: newIngredientQuantity.trim() || "1",
      category,
    };

    setIngredients([...ingredients, newIngredient]);
    setNewIngredientName("");
    setNewIngredientQuantity("");
  };

  const handleAddFromPantry = () => {
    const itemsToAdd = pantryItems
      .filter(item => selectedPantryItems.has(item.id))
      .map(item => ({
        id: `${Date.now()}-${Math.random()}-${item.id}`,
        name: item.name,
        quantity: item.quantity,
        category: item.category,
      }));

    setIngredients([...ingredients, ...itemsToAdd]);
    setSelectedPantryItems(new Set());
    setShowPantrySelector(false);
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== ingredientId));
  };

  const togglePantryItem = (itemId: string) => {
    const newSelected = new Set(selectedPantryItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedPantryItems(newSelected);
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
            {editRecipe ? "Edit Recipe" : "Add Recipe"}
          </ChopText>
          <TouchableOpacity onPress={handleSave}>
            <ChopText variant="theme" size="large" weight="semibold">
              {editRecipe ? "Update" : "Add"}
            </ChopText>
          </TouchableOpacity>
        </View>

        {/* Cook Recipe button - only show when editing existing recipe */}
        {editRecipe && (
          <View style={[styles.cookRecipeContainer, { borderBottomColor: darkMode ? "#333" : "#eee" }]}>
            <TouchableOpacity
              style={[styles.cookRecipeButton, { backgroundColor: themeColor }]}
              onPress={handleCookRecipe}
            >
              <IconSymbol name="flame.fill" size={20} color="#fff" />
              <ChopText size="medium" weight="semibold" color="#fff">
                Cook This Recipe
              </ChopText>
            </TouchableOpacity>
            <ChopText size="xs" variant="muted" style={styles.cookRecipeHint}>
              Subtract ingredients from your pantry
            </ChopText>
          </View>
        )}

        <ScrollView style={styles.content}>
          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Recipe Name *
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
              placeholder="e.g., Fried Rice, Chocolate Cake"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Description (Optional)
            </ChopText>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: darkMode ? "#222" : "#f5f5f5",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={description}
              onChangeText={setDescription}
              placeholder="Brief description of the recipe"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Servings *
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#222" : "#f5f5f5",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              value={servings}
              onChangeText={setServings}
              placeholder="4"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              keyboardType="number-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <ChopText size="small" variant="muted" style={styles.label}>
              Ingredients * ({ingredients.length})
            </ChopText>

            {/* Current ingredients list */}
            {ingredients.length > 0 && (
              <View style={styles.ingredientsList}>
                {ingredients.map((ingredient) => (
                  <View
                    key={ingredient.id}
                    style={[
                      styles.ingredientItem,
                      { backgroundColor: darkMode ? "#1a1a1a" : "#f9f9f9" },
                    ]}
                  >
                    <View style={styles.ingredientInfo}>
                      <ChopText size="small" weight="semibold">
                        {ingredient.name}
                      </ChopText>
                      <ChopText size="xs" variant="muted">
                        {ingredient.quantity}
                      </ChopText>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleRemoveIngredient(ingredient.id)}
                    >
                      <IconSymbol name="xmark.circle.fill" size={20} color="#ff3b30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add ingredient section */}
            {!showPantrySelector && (
              <>
                <View style={styles.addIngredientForm}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.ingredientNameInput,
                      {
                        backgroundColor: darkMode ? "#222" : "#f5f5f5",
                        color: darkMode ? "#fff" : "#000",
                      },
                    ]}
                    value={newIngredientName}
                    onChangeText={setNewIngredientName}
                    placeholder="Ingredient name"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                  />
                  <TextInput
                    style={[
                      styles.input,
                      styles.ingredientQuantityInput,
                      {
                        backgroundColor: darkMode ? "#222" : "#f5f5f5",
                        color: darkMode ? "#fff" : "#000",
                      },
                    ]}
                    value={newIngredientQuantity}
                    onChangeText={setNewIngredientQuantity}
                    placeholder="Quantity"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                  />
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: themeColor }]}
                    onPress={handleAddManualIngredient}
                  >
                    <IconSymbol name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[
                    styles.pantryButton,
                    { backgroundColor: darkMode ? "#1a1a1a" : "#f5f5f5" },
                  ]}
                  onPress={() => setShowPantrySelector(true)}
                >
                  <IconSymbol name="list.bullet" size={18} color={themeColor} />
                  <ChopText size="small" variant="theme">
                    Select from Pantry
                  </ChopText>
                </TouchableOpacity>
              </>
            )}

            {/* Pantry selector */}
            {showPantrySelector && (
              <View style={styles.pantrySelector}>
                <View style={styles.pantrySelectorHeader}>
                  <ChopText size="small" weight="semibold">
                    Select from Pantry ({selectedPantryItems.size} selected)
                  </ChopText>
                  <TouchableOpacity onPress={() => setShowPantrySelector(false)}>
                    <ChopText size="small" variant="theme">Cancel</ChopText>
                  </TouchableOpacity>
                </View>
                <ScrollView style={styles.pantryItemsList} nestedScrollEnabled>
                  {pantryItems.map((item) => {
                    const isSelected = selectedPantryItems.has(item.id);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.pantryItem,
                          { backgroundColor: darkMode ? "#1a1a1a" : "#f9f9f9" },
                          isSelected && { backgroundColor: darkMode ? '#1c3a4a' : '#e3f2fd' },
                        ]}
                        onPress={() => togglePantryItem(item.id)}
                      >
                        <IconSymbol
                          name={isSelected ? 'checkmark.circle.fill' : 'circle'}
                          size={20}
                          color={isSelected ? themeColor : darkMode ? '#666' : '#ccc'}
                        />
                        <View style={styles.pantryItemInfo}>
                          <ChopText size="small">{item.name}</ChopText>
                          <ChopText size="xs" variant="muted">{item.quantity}</ChopText>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <TouchableOpacity
                  style={[styles.addFromPantryButton, { backgroundColor: themeColor }]}
                  onPress={handleAddFromPantry}
                  disabled={selectedPantryItems.size === 0}
                >
                  <ChopText size="small" weight="semibold" color="#fff">
                    Add {selectedPantryItems.size} Item{selectedPantryItems.size !== 1 ? 's' : ''}
                  </ChopText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoBox}>
            <ChopText size="xs" variant="muted">
              * Required fields
            </ChopText>
            <ChopText size="xs" variant="muted" style={{ marginTop: 4 }}>
              Manually added ingredients won't be added to your pantry list
            </ChopText>
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
  cookRecipeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    alignItems: "center",
  },
  cookRecipeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: "100%",
  },
  cookRecipeHint: {
    marginTop: 8,
    textAlign: "center",
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
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  ingredientsList: {
    marginBottom: 12,
    gap: 8,
  },
  ingredientItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 8,
  },
  ingredientInfo: {
    flex: 1,
  },
  addIngredientForm: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  ingredientNameInput: {
    flex: 2,
  },
  ingredientQuantityInput: {
    flex: 1,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  pantryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 8,
  },
  pantrySelector: {
    marginTop: 12,
  },
  pantrySelectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  pantryItemsList: {
    maxHeight: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  pantryItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
    marginBottom: 4,
    borderRadius: 8,
  },
  pantryItemInfo: {
    flex: 1,
  },
  addFromPantryButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
});
