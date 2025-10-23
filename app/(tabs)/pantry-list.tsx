import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';

export default function PantryListScreen() {
  const items = useAppSelector(state => state.pantryList.items);
  const themeColor = useAppSelector(state => state.settings.themeColor);
  const fontSize = useAppSelector(state => state.settings.fontSize);
  const darkMode = useAppSelector(state => state.settings.darkMode);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  const isExpired = (expirationDate?: number) => {
    if (!expirationDate) return false;
    return expirationDate < Date.now();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]} edges={['top']}>
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: fontSizeValue + 8, color: themeColor }]}>
          Pantry List
        </Text>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' }]}>
            No items in your pantry
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
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemName, { fontSize: fontSizeValue, color: darkMode ? '#fff' : '#000' }]}>
                    {item.name}
                  </Text>
                  {item.expirationDate && (
                    <Text
                      style={[
                        styles.expirationText,
                        { fontSize: fontSizeValue - 4 },
                        isExpired(item.expirationDate) && styles.expiredText,
                      ]}
                    >
                      {isExpired(item.expirationDate)
                        ? 'Expired'
                        : `Expires: ${new Date(item.expirationDate).toLocaleDateString()}`}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemQuantity, { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' }]}>
                  {item.quantity}
                </Text>
              </View>
            </View>
          )}
        />
      )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
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
  itemInfo: {
    flex: 1,
  },
  itemName: {
    marginBottom: 4,
  },
  itemQuantity: {
    marginLeft: 12,
  },
  expirationText: {
    color: '#ff9500',
  },
  expiredText: {
    color: '#ff3b30',
    fontWeight: '600',
  },
});
