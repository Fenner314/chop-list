import { ChopText } from "@/components/chop-text";
import { useAppSelector } from "@/store/hooks";
import React from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ShoppingListScreen() {
  const items = useAppSelector((state) => state.shoppingList.items);
  const darkMode = useAppSelector((state) => state.settings.darkMode);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: darkMode ? "#000" : "#fff" },
      ]}
      edges={['top']}
    >
      <View style={styles.content}>
        <ChopText size="xxl" weight="bold" variant="theme" style={styles.title}>
          Shopping List
        </ChopText>
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <ChopText size="medium" variant="muted" useGlobalFontSize>
            No items in your shopping list
          </ChopText>
          <ChopText size="small" variant="muted" style={styles.emptySubtext}>
            Tap the + button to add items
          </ChopText>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={[
                styles.itemContainer,
                { borderBottomColor: darkMode ? "#333" : "#eee" },
              ]}
            >
              <View style={styles.itemContent}>
                <ChopText
                  size="medium"
                  useGlobalFontSize
                  style={[
                    styles.itemName,
                    item.completed && styles.completedText,
                  ]}
                >
                  {item.name}
                </ChopText>
                <ChopText size="small" variant="muted">
                  {item.quantity}
                </ChopText>
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
    marginBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySubtext: {
    marginTop: 8,
  },
  itemContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  itemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  itemName: {
    flex: 1,
  },
  completedText: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },
});
