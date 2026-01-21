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
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
  const defaultServings = useAppSelector(
    (state) => state.settings.recipesSettings.defaultServings
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState(defaultServings.toString());
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  const nameRef = useRef<TextInput>(null);
  const descriptionRef = useRef<TextInput>(null);
  const servingsRef = useRef<TextInput>(null);
  const ingredientNameRef = useRef<TextInput>(null);
  const ingredientQuantityRef = useRef<TextInput>(null);
  const quantityRowRef = useRef<View>(null);

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
    const timer = setTimeout(() => {
      if (visible && !editRecipe) {
        nameRef.current?.focus();
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [editRecipe, visible]);

  useEffect(() => {
    if (editRecipe) {
      setName(editRecipe.name);
      setDescription(editRecipe.description || "");
      setServings(editRecipe.servings.toString());
      setIngredients([...editRecipe.ingredients]);
    } else {
      setName("");
      setDescription("");
      setServings(defaultServings.toString());

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
  }, [editRecipe, visible, preselectedIngredients, defaultServings]);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter a recipe name");
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

      debugger;
      if (!pantryItem) {
        missingIngredients.push(ingredient);
      } else {
        if (!pantryItem.unit) return;

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

    // Focus the input immediately BEFORE doing anything else to prevent keyboard from closing
    ingredientNameRef.current?.focus();

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

    // Scroll to bottom to show the input fields
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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

    // Keep keyboard open and focus quantity input
    setTimeout(() => {
      ingredientQuantityRef.current?.focus();
    }, 100);
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

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            ref={scrollViewRef}
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            keyboardShouldPersistTaps="handled"
          >
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
                ref={nameRef}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Fried Rice, Chocolate Cake"
                placeholderTextColor={darkMode ? "#666" : "#999"}
                returnKeyType="next"
                onSubmitEditing={() => descriptionRef.current?.focus()}
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
                ref={descriptionRef}
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
                ref={servingsRef}
                value={servings}
                onChangeText={setServings}
                placeholder="4"
                placeholderTextColor={darkMode ? "#666" : "#999"}
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => ingredientNameRef.current?.focus()}
              />
            </View>

            <View style={styles.inputGroup}>
              <ChopText size="small" variant="muted" style={styles.label}>
                Ingredients ({ingredients.length})
              </ChopText>

              {/* Current ingredients list */}
              {ingredients.length > 0 && (
                <View style={styles.ingredientsList}>
                  {ingredients.map((ingredient) => (
                    <TouchableOpacity
                      key={ingredient.id}
                      onPress={() => handleEditIngredient(ingredient)}
                    >
                      <View
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
                          {/* <TouchableOpacity
                          onPress={() => handleEditIngredient(ingredient)}
                          style={{ marginRight: 12 }}
                        >
                          <IconSymbol
                            name="pencil"
                            size={18}
                            color={themeColor}
                          />
                        </TouchableOpacity> */}
                          <TouchableOpacity
                            onPress={() =>
                              handleRemoveIngredient(ingredient.id)
                            }
                          >
                            <IconSymbol
                              name="xmark.circle.fill"
                              size={20}
                              color="#ff3b30"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </TouchableOpacity>
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
                    ref={ingredientNameRef}
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
                    returnKeyType="next"
                    onSubmitEditing={() =>
                      ingredientQuantityRef.current?.focus()
                    }
                    submitBehavior="submit"
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

                  <View ref={quantityRowRef} style={styles.quantityUnitAddRow}>
                    <TextInput
                      ref={ingredientQuantityRef}
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
                      returnKeyType="done"
                      onSubmitEditing={handleAddManualIngredient}
                    />
                    <View
                      style={[
                        styles.unitPickerContainer,
                        { backgroundColor: darkMode ? "#222" : "#f5f5f5" },
                      ]}
                    >
                      <RNPickerSelect
                        value={newIngredientUnit || ""}
                        onValueChange={(value) =>
                          setNewIngredientUnit(value || "")
                        }
                        items={[
                          { label: "(no unit)", value: "" },
                          ...ALL_UNITS.map((unitOption) => ({
                            label: unitOption.label,
                            value: unitOption.value,
                          })),
                        ]}
                        style={{
                          inputIOS: {
                            ...styles.unitPicker,
                            color: darkMode ? "#fff" : "#000",
                          },
                          inputAndroid: {
                            ...styles.unitPicker,
                            color: darkMode ? "#fff" : "#000",
                          },
                        }}
                        placeholder={{}}
                        useNativeAndroidPickerStyle={false}
                      />
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.addButton,
                        { backgroundColor: themeColor },
                      ]}
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

            <View>
              <ChopText size="xs" variant="muted">
                * Required fields
              </ChopText>
              <ChopText size="xs" variant="muted" style={{ marginTop: 4 }}>
                Manually added ingredients won't be added to your pantry list
              </ChopText>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 100,
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
    paddingLeft: 12,
  },
});
