import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppSelector } from '@/store/hooks';

export default function RecipesScreen() {
  const recipes = useAppSelector(state => state.recipes.recipes);
  const themeColor = useAppSelector(state => state.settings.themeColor);
  const fontSize = useAppSelector(state => state.settings.fontSize);
  const darkMode = useAppSelector(state => state.settings.darkMode);

  const fontSizeValue = fontSize === 'small' ? 14 : fontSize === 'large' ? 20 : 16;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: darkMode ? '#000' : '#fff' }]} edges={['top']}>
      <View style={styles.content}>
        <Text style={[styles.title, { fontSize: fontSizeValue + 8, color: themeColor }]}>
          Recipes
        </Text>
      {recipes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { fontSize: fontSizeValue, color: darkMode ? '#999' : '#666' }]}>
            No recipes yet
          </Text>
          <Text style={[styles.emptySubtext, { fontSize: fontSizeValue - 2, color: darkMode ? '#666' : '#999' }]}>
            Tap the + button to add your first recipe
          </Text>
        </View>
      ) : (
        <FlatList
          data={recipes}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.recipeContainer, { borderBottomColor: darkMode ? '#333' : '#eee' }]}>
              <Text style={[styles.recipeName, { fontSize: fontSizeValue + 2, color: darkMode ? '#fff' : '#000' }]}>
                {item.name}
              </Text>
              {item.description && (
                <Text style={[styles.recipeDescription, { fontSize: fontSizeValue - 2, color: darkMode ? '#999' : '#666' }]}>
                  {item.description}
                </Text>
              )}
              <View style={styles.recipeFooter}>
                <Text style={[styles.recipeInfo, { fontSize: fontSizeValue - 3, color: darkMode ? '#666' : '#999' }]}>
                  {item.ingredients.length} ingredients
                </Text>
                <Text style={[styles.recipeInfo, { fontSize: fontSizeValue - 3, color: darkMode ? '#666' : '#999' }]}>
                  Serves {item.servings}
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
  recipeContainer: {
    padding: 16,
    borderBottomWidth: 1,
  },
  recipeName: {
    fontWeight: '600',
    marginBottom: 8,
  },
  recipeDescription: {
    marginBottom: 12,
  },
  recipeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recipeInfo: {
  },
});
