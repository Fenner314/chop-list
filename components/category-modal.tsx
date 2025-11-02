import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { useAppSelector } from '@/store/hooks';
import { Category } from '@/store/slices/settingsSlice';
import { ChopText } from './chop-text';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (category: { name: string; color: string; icon?: string }) => void;
  editCategory?: Category;
}

const PRESET_COLORS = [
  '#FFF9C4', '#C8E6C9', '#FFCDD2', '#FFE0B2',
  '#B3E5FC', '#D7CCC8', '#F8BBD0', '#FFCCBC',
  '#FFF59D', '#FFAB91', '#EF9A9A', '#E6EE9C',
  '#FFECB3', '#FFE082', '#FFCC80', '#C5E1A5',
  '#B0BEC5', '#F48FB1', '#CE93D8', '#E0E0E0',
];

export function CategoryModal({ visible, onClose, onSave, editCategory }: CategoryModalProps) {
  const darkMode = useAppSelector(state => state.settings.darkMode);
  const themeColor = useAppSelector(state => state.settings.themeColor);

  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState('#E0E0E0');

  useEffect(() => {
    if (visible) {
      if (editCategory) {
        setName(editCategory.name);
        setSelectedColor(editCategory.color);
      } else {
        setName('');
        setSelectedColor('#E0E0E0');
      }
    }
  }, [editCategory, visible]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      color: selectedColor,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: darkMode ? '#1c1c1e' : '#fff' }]}>
          <View style={styles.modalHeader}>
            <ChopText size="xl" weight="bold">
              {editCategory ? 'Edit Category' : 'Add Category'}
            </ChopText>
            <TouchableOpacity onPress={onClose}>
              <ChopText size="large" variant="muted">✕</ChopText>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <ChopText size="small" weight="semibold" style={styles.label}>
              Category Name *
            </ChopText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: darkMode ? '#2c2c2e' : '#f0f0f0',
                  color: darkMode ? '#fff' : '#000',
                },
              ]}
              placeholder="e.g., Dairy, Produce, Snacks"
              placeholderTextColor={darkMode ? '#666' : '#999'}
              value={name}
              onChangeText={setName}
              autoFocus
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
                    <ChopText size="large" color="#333">✓</ChopText>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.previewSection}>
              <ChopText size="small" weight="semibold" style={styles.label}>
                Preview
              </ChopText>
              <View style={[styles.preview, { backgroundColor: selectedColor }]}>
                <ChopText size="medium" weight="semibold" color="#333">
                  {name || 'Category Name'}
                </ChopText>
              </View>
            </View>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: darkMode ? '#2c2c2e' : '#f0f0f0' }]}
              onPress={onClose}
            >
              <ChopText size="medium" weight="semibold">Cancel</ChopText>
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
                {editCategory ? 'Update' : 'Add'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalBody: {
    padding: 20,
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
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  previewSection: {
    marginTop: 24,
  },
  preview: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
  },
  saveButton: {
  },
  disabledButton: {
    opacity: 0.5,
  },
});
