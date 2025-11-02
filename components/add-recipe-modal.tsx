import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectPantryItems } from "@/store/selectors/itemsSelectors";
import { subtractRecipeFromPantry } from "@/store/slices/itemsSlice";
import {
  addRecipe,
  Recipe,
  RecipeIngredient,
  updateRecipe,
} from "@/store/slices/recipesSlice";
import { autoCategorizeItem } from "@/utils/categorization";
import { ALL_UNITS, formatQuantityWithUnit } from "@/utils/unitConversion";
import { Picker } from "@react-native-picker/picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

interface AddRecipeModalProps {
  visible: boolean;
  onClose: () => void;
  editRecipe?: Recipe;
  preselectedIngredients?: Array<{
    name: string;
    quantity: string;
    category: string;
  }>;
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

  // New ingredient form
  const [newIngredientName, setNewIngredientName] = useState("");
  const [newIngredientQuantity, setNewIngredientQuantity] = useState("");
  const [newIngredientUnit, setNewIngredientUnit] = useState<string>("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Edit ingredient
  const [editingIngredient, setEditingIngredient] =
    useState<RecipeIngredient | null>(null);

  // Filter pantry items for suggestions
  const suggestedItems = newIngredientName.trim()
    ? pantryItems
        .filter(
          (item) =>
            item.name.toLowerCase().includes(newIngredientName.toLowerCase()) &&
            !ingredients.some(
              (ing) => ing.name.toLowerCase() === item.name.toLowerCase()
            )
        )
        .slice(0, 5)
    : [];

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
        const preselected: RecipeIngredient[] = preselectedIngredients.map(
          (item) => ({
            id: `${Date.now()}-${Math.random()}`,
            name: item.name,
            quantity: item.quantity,
            category: item.category,
          })
        );
        setIngredients(preselected);
      } else {
        setIngredients([]);
      }
    }
    setNewIngredientName("");
    setNewIngredientQuantity("");
    setNewIngredientUnit("");
    setShowSuggestions(false);
    setEditingIngredient(null);
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
    const insufficientIngredients: Array<{
      ingredient: RecipeIngredient;
      available: number;
      needed: number;
    }> = [];

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
        message += `Missing from pantry:\n${missingIngredients
          .map((i) => `• ${i.name}`)
          .join("\n")}`;
      }

      if (insufficientIngredients.length > 0) {
        if (message) message += "\n\n";
        message += `Insufficient quantity:\n${insufficientIngredients
          .map(
            (i) =>
              `• ${i.ingredient.name}: have ${i.available}, need ${i.needed}`
          )
          .join("\n")}`;
      }

      if (availableIngredients.length > 0) {
        message +=
          "\n\nDo you want to subtract the available ingredients anyway?";
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
            dispatch(
              subtractRecipeFromPantry({ ingredients: availableIngredients })
            );
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
              dispatch(
                subtractRecipeFromPantry({
                  ingredients: editRecipe.ingredients,
                })
              );
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

    if (editingIngredient) {
      // Update existing ingredient
      const updatedIngredients = ingredients.map((ing) =>
        ing.id === editingIngredient.id
          ? {
              ...ing,
              name: newIngredientName.trim(),
              quantity: newIngredientQuantity.trim() || "1",
              unit: newIngredientUnit || undefined,
            }
          : ing
      );
      setIngredients(updatedIngredients);
      setEditingIngredient(null);
    } else {
      // Add new ingredient
      const category = autoCategorizeItem(newIngredientName);

      const newIngredient: RecipeIngredient = {
        id: `${Date.now()}-${Math.random()}`,
        name: newIngredientName.trim(),
        quantity: newIngredientQuantity.trim() || "1",
        unit: newIngredientUnit || undefined,
        category,
      };

      setIngredients([...ingredients, newIngredient]);
    }

    setNewIngredientName("");
    setNewIngredientQuantity("");
    setNewIngredientUnit("");
  };

  const handleRemoveIngredient = (ingredientId: string) => {
    setIngredients(ingredients.filter((ing) => ing.id !== ingredientId));
    if (editingIngredient?.id === ingredientId) {
      setEditingIngredient(null);
      setNewIngredientName("");
      setNewIngredientQuantity("");
      setNewIngredientUnit("");
    }
  };

  const handleEditIngredient = (ingredient: RecipeIngredient) => {
    setEditingIngredient(ingredient);
    setNewIngredientName(ingredient.name);
    setNewIngredientQuantity(ingredient.quantity);
    setNewIngredientUnit(ingredient.unit || "");
  };

  const handleCancelEdit = () => {
    setEditingIngredient(null);
    setNewIngredientName("");
    setNewIngredientQuantity("");
    setNewIngredientUnit("");
  };

  const handleSelectSuggestion = (item: any) => {
    setNewIngredientName(item.name);
    setNewIngredientQuantity(item.quantity);
    setNewIngredientUnit(item.unit || "");
    setShowSuggestions(false);
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
          <View
            style={[
              styles.cookRecipeContainer,
              { borderBottomColor: darkMode ? "#333" : "#eee" },
            ]}
          >
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
                        {formatQuantityWithUnit(
                          ingredient.quantity,
                          ingredient.unit
                        )}
                      </ChopText>
                    </View>
                    <View style={styles.ingredientActions}>
                      <TouchableOpacity
                        onPress={() => handleEditIngredient(ingredient)}
                        style={{ marginRight: 12 }}
                      >
                        <IconSymbol
                          name="pencil"
                          size={18}
                          color={themeColor}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRemoveIngredient(ingredient.id)}
                      >
                        <IconSymbol
                          name="xmark.circle.fill"
                          size={20}
                          color="#ff3b30"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Add/Edit ingredient section */}
            <>
              {editingIngredient && (
                <View
                  style={[
                    styles.editingBanner,
                    { backgroundColor: darkMode ? "#2a2a2a" : "#e8f4f8" },
                  ]}
                >
                  <ChopText size="xs" variant="muted">
                    Editing: {editingIngredient.name}
                  </ChopText>
                  <TouchableOpacity onPress={handleCancelEdit}>
                    <ChopText size="xs" variant="theme">
                      Cancel
                    </ChopText>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.addIngredientFormColumn}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: darkMode ? "#222" : "#f5f5f5",
                      color: darkMode ? "#fff" : "#000",
                    },
                  ]}
                  value={newIngredientName}
                  onChangeText={(text) => {
                    setNewIngredientName(text);
                    setShowSuggestions(text.trim().length > 0);
                  }}
                  placeholder="Ingredient name"
                  placeholderTextColor={darkMode ? "#666" : "#999"}
                />

                {/* Pantry suggestions */}
                {showSuggestions && suggestedItems.length > 0 && (
                  <View
                    style={[
                      styles.suggestionsContainer,
                      { backgroundColor: darkMode ? "#1a1a1a" : "#f9f9f9" },
                    ]}
                  >
                    {suggestedItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.suggestionItem,
                          { borderBottomColor: darkMode ? "#333" : "#eee" },
                        ]}
                        onPress={() => handleSelectSuggestion(item)}
                      >
                        <View style={styles.suggestionInfo}>
                          <ChopText size="small" weight="semibold">
                            {item.name}
                          </ChopText>
                          <ChopText size="xs" variant="muted">
                            {formatQuantityWithUnit(item.quantity, item.unit)}
                          </ChopText>
                        </View>
                        <IconSymbol
                          name="plus.circle"
                          size={18}
                          color={themeColor}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                <View style={styles.quantityUnitAddRow}>
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
                    placeholder="Qty"
                    placeholderTextColor={darkMode ? "#666" : "#999"}
                    keyboardType="decimal-pad"
                  />
                  <View
                    style={[
                      styles.unitPickerContainer,
                      { backgroundColor: darkMode ? "#222" : "#f5f5f5" },
                    ]}
                  >
                    <Picker
                      selectedValue={newIngredientUnit}
                      onValueChange={setNewIngredientUnit}
                      style={[
                        styles.unitPicker,
                        { color: darkMode ? "#fff" : "#000" },
                      ]}
                    >
                      <Picker.Item label="(no unit)" value="" />
                      {ALL_UNITS.map((unitOption) => (
                        <Picker.Item
                          key={unitOption.value}
                          label={unitOption.label}
                          value={unitOption.value}
                        />
                      ))}
                    </Picker>
                  </View>
                  <TouchableOpacity
                    style={[styles.addButton, { backgroundColor: themeColor }]}
                    onPress={handleAddManualIngredient}
                  >
                    <IconSymbol
                      name={editingIngredient ? "checkmark" : "plus"}
                      size={20}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </>
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
  addIngredientFormColumn: {
    gap: 12,
  },
  suggestionsContainer: {
    borderRadius: 8,
    overflow: "hidden",
  },
  suggestionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionInfo: {
    flex: 1,
  },
  quantityUnitAddRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  infoBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  ingredientActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editingBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  unitPickerContainer: {
    flex: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  unitPicker: {
    height: 44,
  },
});
