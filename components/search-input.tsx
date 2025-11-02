import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { IconSymbol } from './ui/icon-symbol';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  darkMode?: boolean;
}

export function SearchInput({
  value,
  onChangeText,
  placeholder = 'Search...',
  darkMode = false,
}: SearchInputProps) {
  return (
    <View
      style={[
        styles.searchContainer,
        { backgroundColor: darkMode ? '#1a1a1a' : '#f5f5f5' },
      ]}
    >
      <IconSymbol
        name="magnifyingglass"
        size={18}
        color={darkMode ? '#666' : '#999'}
      />
      <TextInput
        style={[
          styles.searchInput,
          {
            color: darkMode ? '#fff' : '#000',
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={darkMode ? '#666' : '#999'}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <IconSymbol
            name="xmark.circle.fill"
            size={18}
            color={darkMode ? '#666' : '#999'}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
});
