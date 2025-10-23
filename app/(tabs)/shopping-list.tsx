import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useAppSelector } from '@/store/hooks';

export default function ShoppingListScreen() {
  const items = useAppSelector(state => state.shoppingList.items);
  const themeColor = useAppSelector(state => state.settings.themeColor);
  const fontSize = useAppSelector(state => state.settings.fontSize);
  const darkMode = useAppSelector(state => state.settings.darkMode);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  return (
    <View style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]}>
      <Text style={[styles.title, { fontSize: fontSizeValue + 8, color: themeColor }]}>
        Shopping List
      </Text>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' }]}>
            No items in your shopping list
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' }]}>
            Tap the + button to add items
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.itemContainer, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
              <View style={styles.itemContent}>
                <Text
                  style={[
                    styles.itemName,
                    { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#000' },
                    item.completed && styles.completedText,
                  ]}
                >
                  {item.name}
                </Text>
                <Text style={[styles.itemQuantity, { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' }]}>
                  {item.quantity}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginBottom: 8,
  },
  emptySubtext: {
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    flex: 1,
  },
  itemQuantity: {
    marginLeft: 12,
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
});
