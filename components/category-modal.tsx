import { DynamicIcon } from "@/components/dynamic-icon";
import { FOOD_ICONS, getIconFamily } from "@/constants/food-icons";
import { PRESET_COLORS } from "@/constants/preset-colors";
import { useAppSelector } from "@/store/hooks";
import { Category } from "@/store/slices/settingsSlice";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ChopText } from "./chop-text";

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (category: { name: string; color: string; icon?: string }) => void;
  editCategory?: Category;
}

export function CategoryModal({
  visible,
  onClose,
  onSave,
  editCategory,
}: CategoryModalProps) {
  const darkMode = useAppSelector((state) => state.settings.darkMode);
  const themeColor = useAppSelector((state) => state.settings.themeColor);

  const scrollViewRef = useRef<ScrollView>(null);
  const [scrollY, setScrollY] = useState(0);

  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#E0E0E0");
  const [selectedIcon, setSelectedIcon] = useState<string | undefined>(
    undefined
  );
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  useEffect(() => {
    if (visible) {
      if (editCategory) {
        setName(editCategory.name);
        setSelectedColor(editCategory.color);
        setSelectedIcon(editCategory.icon);
      } else {
        setName("");
        setSelectedColor("#E0E0E0");
        setSelectedIcon(undefined);
      }
      setIconSearchQuery("");
    }
  }, [editCategory, visible]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });

    onClose();
  };

  // Filter icons based on search query
  const filteredIcons = iconSearchQuery.trim()
    ? FOOD_ICONS.filter((icon) =>
        icon.name.toLowerCase().includes(iconSearchQuery.toLowerCase())
      )
    : FOOD_ICONS;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            { backgroundColor: darkMode ? "#1c1c1e" : "#fff" },
          ]}
        >
          <View style={styles.modalHeader}>
            <ChopText size="xl" weight="bold">
              {editCategory ? "Edit Category" : "Add Category"}
            </ChopText>
            <TouchableOpacity onPress={onClose}>
              <ChopText size="large" variant="muted">
                ✕
              </ChopText>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.modalBody}
            contentContainerStyle={styles.scrollContent}
            onScroll={(event) => {
              setScrollY(event.nativeEvent.contentOffset.y);
            }}
            scrollEventThrottle={16}
          >
            <ChopText size="small" weight="semibold" style={styles.label}>
              Category Name *
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? "#2c2c2e" : "#f0f0f0",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              placeholder="e.g., Dairy, Produce, Snacks"
              placeholderTextColor={darkMode ? "#666" : "#999"}
              value={name}
              onChangeText={setName}
              autoFocus={!editCategory}
            />

            <ChopText size="small" weight="semibold" style={styles.label}>
              Category Color
            </ChopText>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((color) => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    selectedColor === color && {
                      borderColor: themeColor,
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {selectedColor === color && (
                    <ChopText size="large" color="#333">
                      ✓
                    </ChopText>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <ChopText size="small" weight="semibold" style={styles.label}>
              Category Icon (Optional)
            </ChopText>
            <TextInput
              style={[
                styles.input,
                styles.iconSearchInput,
                {
                  backgroundColor: darkMode ? "#2c2c2e" : "#f0f0f0",
                  color: darkMode ? "#fff" : "#000",
                },
              ]}
              placeholder="Search icons..."
              placeholderTextColor={darkMode ? "#666" : "#999"}
              value={iconSearchQuery}
              onChangeText={setIconSearchQuery}
              onFocus={() => {
                // Scroll down to reveal the icon grid
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({
                    y: scrollY + 100,
                    animated: true,
                  });
                }, 200);
              }}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.iconScroll}
              contentContainerStyle={styles.iconScrollContent}
            >
              <TouchableOpacity
                style={[
                  styles.iconOption,
                  {
                    backgroundColor: darkMode ? "#2c2c2e" : "#f0f0f0",
                    borderColor:
                      selectedIcon === undefined ? themeColor : "transparent",
                  },
                  selectedIcon === undefined && {
                    borderWidth: 3,
                  },
                ]}
                onPress={() => setSelectedIcon(undefined)}
              >
                <ChopText size="xs" variant="muted">
                  None
                </ChopText>
              </TouchableOpacity>
              {filteredIcons.map((icon) => (
                <TouchableOpacity
                  key={`${icon.name}-${icon.family}`}
                  style={[
                    styles.iconOption,
                    {
                      backgroundColor: darkMode ? "#2c2c2e" : "#f0f0f0",
                      borderColor:
                        selectedIcon === icon.name ? themeColor : "transparent",
                    },
                    selectedIcon === icon.name && {
                      borderWidth: 3,
                    },
                  ]}
                  onPress={() => setSelectedIcon(icon.name)}
                >
                  <DynamicIcon
                    family={icon.family}
                    name={icon.name}
                    size={28}
                    color={darkMode ? "#fff" : "#333"}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.previewSection}>
              <ChopText size="small" weight="semibold" style={styles.label}>
                Preview
              </ChopText>
              <View
                style={[styles.preview, { backgroundColor: selectedColor }]}
              >
                <View style={styles.previewContent}>
                  {selectedIcon && (
                    <DynamicIcon
                      family={getIconFamily(selectedIcon)}
                      name={selectedIcon}
                      size={24}
                      color="#333"
                      style={styles.previewIcon}
                    />
                  )}
                  <ChopText size="medium" weight="semibold" color="#333">
                    {name || "Category Name"}
                  </ChopText>
                </View>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.cancelButton,
                { backgroundColor: darkMode ? "#2c2c2e" : "#f0f0f0" },
              ]}
              onPress={onClose}
            >
              <ChopText size="medium" weight="semibold">
                Cancel
              </ChopText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.button,
                styles.saveButton,
                { backgroundColor: themeColor },
                !name.trim() && styles.disabledButton,
              ]}
              onPress={handleSave}
              disabled={!name.trim()}
            >
              <ChopText size="medium" weight="semibold" color="#fff">
                {editCategory ? "Update" : "Add"}
              </ChopText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalBody: {
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  label: {
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  iconSearchInput: {
    marginBottom: 8,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  previewSection: {
    marginTop: 24,
  },
  preview: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  previewContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  previewIcon: {
    marginRight: 8,
  },
  iconScroll: {
    marginTop: 8,
  },
  iconScrollContent: {
    paddingRight: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 2,
    borderColor: "transparent",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {},
  saveButton: {},
  disabledButton: {
    opacity: 0.5,
  },
});
